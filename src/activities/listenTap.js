// Listen and tap — the backbone activity at both ages.
//
// The child hears an English word and taps the matching picture. This is a
// receptive task: it needs no reading and no speech, which is why a 2-year-old
// can do it on day one and why it is the only quiz type they get.
//
// Only the first attempt counts toward the word's schedule. After a miss the
// question stays open, the pet re-asks, and the child keeps trying until they
// succeed — the round always ends on a right answer.

import { el } from '../ui/dom.js';
import { prompt, choiceGrid, lvHintButton } from '../ui/components.js';
import { buildQuestion } from '../core/selector.js';
import { petReact, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith, idleHint } from './base.js';

export function run(ctx) {
  const { round, profile, pool } = ctx;
  const word = round.word;
  const question = buildQuestion(word, pool, { ageBand: profile.ageBand, progress: ctx.progress });

  return new Promise((resolve) => {
    let attempts = 0;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const grid = choiceGrid(question.options, {
      ageBand: profile.ageBand,
      // Five-year-olds see the written word: pairing print with speech is how
      // reading starts. Toddlers get pictures only.
      showText: profile.ageBand === 5,
      onPick: (picked) => onPick(picked),
    });

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await ctx.say(word);
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
        await ask();                       // re-ask; the right answer is still there
        return;
      }

      done = true;
      grid.lock();
      play('correct');
      petReact.correct();
      // Say it once more on success: the child now has the meaning in mind,
      // which is the moment the label sticks.
      ctx.say(word);
      await grid.markCorrect(word.id);
      ctx.result(word.id, attempts === 1, Math.round(performance.now() - askedAt));
      resolve();
    }

    setPetPlacement('corner');
    stageWith(
      ctx,
      prompt(profile.ageBand === 2 ? t('act.whichIs') : t('act.listen'), {
        onReplay: () => ctx.say(word),
      }),
      grid.root,
      profile.settings.lvHints && profile.ageBand === 5
        ? el('div.stage__footer', {}, [lvHintButton(word)])
        : null,
    );

    ask();
  });
}
