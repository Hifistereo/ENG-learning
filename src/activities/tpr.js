// Total Physical Response — the movement break.
//
// The pet says an English verb and acts it out; the child copies it. Linking a
// word to a physical action is the single most effective way to teach verbs at
// this age, and it doubles as the attention reset that lets the second half of
// the session work at all.
//
// Unscored: tapping "I did it" is a self-report, and self-reports must not
// feed the review schedule or a child could mark themselves to mastery
// without ever recognising the word.

import { el, wait } from '../ui/dom.js';
import { pictureEl } from '../media/picture.js';
import { primaryButton } from '../ui/components.js';
import { petReact, petSay, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith } from './base.js';

const CALLS = 3;

export function run(ctx) {
  const word = ctx.round.word;
  if (!word) return Promise.resolve();

  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      petReact.correct();
      play('correct');
      resolve();
    };

    setPetPlacement('stage');
    petReact.dancing();

    stageWith(
      ctx,
      el('div.prompt', {}, [el('span.prompt__text', { text: t('act.tprTitle') })]),
      el('div.tpr', {}, [
        pictureEl(word, { size: 'clamp(5rem, 22vw, 9rem)', className: 'tpr__pic' }),
        el('span.tpr__word', { text: word.en }),
        el('span.tpr__lv', { text: word.lv }),
      ]),
      el('div.stage__footer', {}, [primaryButton(t('act.tprDone'), done, { emoji: '🙌' })]),
    );

    (async () => {
      for (let i = 0; i < CALLS && !finished; i += 1) {
        petSay(word.en, 1400);
        await ctx.say(word);
        await wait(900);
      }
    })();
  });
}
