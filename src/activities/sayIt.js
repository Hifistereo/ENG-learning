// Say it yourself — age 5 only, production practice.
//
// The pet models the word, the child repeats it out loud, and (if a parent has
// switched the microphone on) can hear their own attempt played straight after
// the model. Hearing the two side by side is what makes a five-year-old
// self-correct; being told they said it wrong is what makes them stop trying.
//
// Deliberately unscored. Whether the child actually said it is a self-report,
// and self-reports must never touch the review schedule — otherwise a child
// could tap their way to "mastered" without ever recognising the word.

import { el, wait } from '../ui/dom.js';
import { bigCard, primaryButton } from '../ui/components.js';
import { petReact, petSay, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import * as mic from '../media/mic.js';
import { stageWith } from './base.js';

export function run(ctx) {
  const { round, profile } = ctx;
  const word = round.word;
  const micAllowed = profile.settings.mic && mic.isSupported();

  return new Promise((resolve) => {
    let recording = false;
    let clip = null;
    let finished = false;

    const finish = async () => {
      if (finished) return;
      finished = true;
      mic.release();                 // stop the mic and drop the clip
      play('correct');
      petReact.correct();
      await wait(400);
      resolve();
    };

    const recordBtn = micAllowed
      ? el('button.btn.recbtn', {
          type: 'button',
          on: { click: () => toggleRecord() },
        }, [el('span.recbtn__dot'), el('span.recbtn__label', { text: t('act.sayItRecord') })])
      : null;

    const playbackBtn = micAllowed
      ? el('button.btn.recbtn.recbtn--play', {
          type: 'button',
          disabled: true,
          on: { click: () => mic.playback(clip) },
        }, [el('span', { text: '▶' }), el('span', { text: t('act.sayItPlayback') })])
      : null;

    async function toggleRecord() {
      if (recording) {
        recording = false;
        recordBtn.classList.remove('is-recording');
        recordBtn.querySelector('.recbtn__label').textContent = t('act.sayItRecord');
        clip = await mic.stop();
        if (clip) {
          playbackBtn.disabled = false;
          await wait(250);
          await ctx.say(word);       // model first...
          await wait(250);
          await mic.playback(clip);  // ...then the child, for direct comparison
        }
        return;
      }

      const started = await mic.start();
      if (!started.ok) {
        // Permission refused or unsupported: quietly drop back to listen and
        // repeat. Never block the round on a hardware feature.
        recordBtn.remove();
        playbackBtn?.remove();
        return;
      }
      recording = true;
      recordBtn.classList.add('is-recording');
      recordBtn.querySelector('.recbtn__label').textContent = t('act.sayItStop');
    }

    setPetPlacement('corner');
    stageWith(
      ctx,
      el('div.prompt', {}, [el('span.prompt__text', { text: t('act.sayItTitle') })]),
      bigCard(word, { showText: true, onTap: () => { play('tap'); ctx.say(word); } }),
      el('p.stage__hint', { text: t('act.sayItHint') }),
      el('div.sayit__controls', {}, [recordBtn, playbackBtn].filter(Boolean)),
      el('div.stage__footer', {}, [primaryButton(t('btn.done'), finish, { emoji: '👍' })]),
    );

    (async () => {
      petReact.asking();
      petSay(word.en, 2400);
      await ctx.say(word);
      await wait(400);
      if (!finished) await ctx.say(word);
      petReact.idle();
    })();
  });
}
