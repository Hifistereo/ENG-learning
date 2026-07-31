// Transfer check — the same word, a picture the child has never seen.
//
// This is the activity that tells us whether a word was actually learned. A
// child drilled on 🐱 may have learned that particular image; hand them 🐈 and
// the difference shows immediately. Colours are the sharpest case: a child who
// only ever meets 🔴 may have learned "red means the circle".
//
// It looks almost identical to listen-and-tap on purpose. The child should not
// experience this as a test — from their side it is just another question,
// which is exactly why the answer is trustworthy.
//
// Runs only on words that already have plain recognition (see
// knowledge.readyForTransfer): showing an unfamiliar picture of a word the
// child has not yet pinned down teaches confusion, not transfer.

import { el } from '../ui/dom.js';
import { prompt, choiceGrid } from '../ui/components.js';
import { pictureOf } from '../data/words.js';
import { pickDistractors } from '../core/selector.js';
import { CHOICE_COUNT } from '../core/selector.js';
import { petReact, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith, idleHint } from './base.js';

export function run(ctx) {
  const { round, profile, pool } = ctx;
  const word = round.word;

  // No second picture means no transfer question to ask.
  if (!word.alt) return import('./listenTap.js').then((m) => m.run(ctx));

  const choices = CHOICE_COUNT[profile.ageBand] ?? CHOICE_COUNT[5];
  const distractors = pickDistractors(word, pool, choices - 1, {
    ageBand: profile.ageBand,
    progress: ctx.progress,
  });

  // The target is shown as its ALTERNATE picture; distractors keep their
  // usual ones. Swapping every picture at once would turn this into a
  // different task — a general "can you cope with new images" test rather
  // than a question about this word.
  const options = [pictureOf(word, true), ...distractors].sort(() => Math.random() - 0.5);
  const answerId = `${word.id}__alt`;

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const grid = choiceGrid(options, {
      ageBand: profile.ageBand,
      showText: false,      // the written word would give it away outright
      onPick: (picked) => onPick(picked),
    });

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await ctx.say(word);
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;                  // from here on, nothing is proved
        petReact.hint(grid.directionOf(answerId));
        grid.hint(answerId);
      });
    };

    async function onPick(picked) {
      if (done) return;
      hint.cancel();
      attempts += 1;

      if (picked.id !== answerId) {
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
      ctx.say(word);
      await grid.markCorrect(answerId);

      // Only a first-time, unaided success counts as transfer. Everything else
      // is ordinary recognition practice, and is recorded as such.
      const clean = attempts === 1 && !aided;
      ctx.result(word.id, clean, Math.round(performance.now() - askedAt), {
        activity: clean ? 'transfer' : 'listenTap',
        aided,
      });
      resolve();
    }

    setPetPlacement('corner');
    stageWith(
      ctx,
      prompt(t('act.whichIs'), { onReplay: () => ctx.say(word) }),
      grid.root,
      el('p.stage__hint', { text: t('act.transferHint') }),
    );

    ask();
  });
}
