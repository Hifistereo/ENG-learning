// Initial sounds — age 5 only.
//
// The child sees a letter, hears its name, and taps the picture whose English
// word starts with it. Note what is deliberately *not* spoken: the words. If
// the pet said "cat", the task would collapse into listen-and-tap. Having to
// retrieve each picture's English name and then its first sound is the whole
// point, which is why phonics only ever runs on words already in review.
//
// Words whose spelling misleads (one, eye, eight) are excluded upstream by
// initialLetter() — teaching that "one" starts with an /o/ sound would be a
// lie we'd have to unteach later.

import { el } from '../ui/dom.js';
import { prompt, choiceGrid } from '../ui/components.js';
import { initialLetter } from '../data/words.js';
import { petReact, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith, idleHint } from './base.js';

const CHOICES = 3;

/** Same-unit words that start with a different letter, familiar ones first. */
function distractors(target, pool, progress, count) {
  const letter = initialLetter(target);
  const usable = pool.filter((w) =>
    w.id !== target.id && initialLetter(w) && initialLetter(w) !== letter);

  const rank = (w) => (w.unit === target.unit ? 0 : 1) + (progress.words[w.id] ? 0 : 2);
  return [...usable]
    .sort((a, b) => rank(a) - rank(b) || Math.random() - 0.5)
    .slice(0, count);
}

export function run(ctx) {
  const { round, profile, pool, progress } = ctx;
  const word = round.word;
  const letter = initialLetter(word);

  // Defensive: the planner filters these out, but never quiz a misleading word.
  if (!letter) return Promise.resolve();

  const options = [word, ...distractors(word, pool, progress, CHOICES - 1)]
    .sort(() => Math.random() - 0.5);

  return new Promise((resolve) => {
    let attempts = 0;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const grid = choiceGrid(options, {
      ageBand: 5,
      showText: false,          // showing the words would give the answer away
      onPick: (picked) => onPick(picked),
    });

    const sayLetter = () => ctx.sayText(letter.toUpperCase());

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await sayLetter();
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        petReact.hint(grid.directionOf(word.id));
        grid.hint(word.id);
      });
    };

    async function onPick(picked) {
      if (done) return;
      hint.cancel();
      attempts += 1;

      if (picked.id !== word.id) {
        play('wrong');
        petReact.wrong();
        await grid.markWrong(picked.id);
        await ask();
        return;
      }

      done = true;
      grid.lock();
      play('correct');
      petReact.correct();
      ctx.say(word);            // now that it is solved, name it
      await grid.markCorrect(word.id);
      ctx.result(word.id, attempts === 1, Math.round(performance.now() - askedAt));
      resolve();
    }

    setPetPlacement('corner');
    stageWith(
      ctx,
      prompt(t('act.phonicsPick', { letter: letter.toUpperCase() }), { onReplay: sayLetter }),
      el('div.letter', {}, [
        el('span.letter__big', { text: letter.toUpperCase() }),
        el('span.letter__small', { text: letter }),
      ]),
      grid.root,
    );

    ask();
  });
}
