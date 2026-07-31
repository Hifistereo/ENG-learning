// Sentence frames — age 5 only.
//
// The pet says a whole sentence ("I see a cat") and the child completes the
// written frame by tapping the right picture. One fixed frame with one
// swappable slot means the child processes a full English sentence while only
// having to retrieve a single word, which is how sentence-level comprehension
// gets started without becoming a memory test.

import { el } from '../ui/dom.js';
import { framesForWords, renderFrame } from '../data/phrases.js';
import { buildQuestion } from '../core/selector.js';
import { petReact, petSay } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { idleHint } from './base.js';

export function run(ctx) {
  const { round, profile, pool, scene } = ctx;
  const word = round.word;

  const frames = framesForWords([word]);
  // No frame fits this word — fall back rather than showing an empty round.
  if (!frames.length) return import('./listenTap.js').then((m) => m.run(ctx));

  const frame = frames[Math.floor(Math.random() * frames.length)];
  const sentence = renderFrame(frame, word);
  const blanked = frame.pattern.replace('___', '_____');

  const question = buildQuestion(word, pool, { ageBand: 5, progress: ctx.progress });

  return new Promise((resolve) => {
    let attempts = 0;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    // The half-finished sentence is what the character is saying, so it goes
    // in the caption where every other spoken line goes.
    scene.clearCast();
    scene.say(blanked, profile.settings.lvHints ? frame.lv.replace('___', '…') : '');

    const grid = scene.setProps(question.options, {
      showText: true,
      onPick: (picked) => onPick(picked),
    });

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await ctx.sayText(sentence);
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

      // Reveal the completed sentence and say it once more — the child sees
      // the whole thing they just built.
      scene.say(sentence, profile.settings.lvHints ? renderFrame(frame, word, 'lv') : '');
      petSay(sentence, 2600);
      ctx.sayText(sentence);

      await grid.markCorrect(word.id);
      ctx.result(word.id, attempts === 1, Math.round(performance.now() - askedAt));
      resolve();
    }

    scene.setExtra(el('button.iconbtn.iconbtn--round', {
      type: 'button',
      'aria-label': t('act.listenAgain'),
      on: { click: () => ctx.sayText(sentence) },
    }, '🔊'));

    ask();
  });
}
