// "Teach the silly alien" — production.
//
// The alien is confidently wrong: it shows a horse and announces "This is a
// cow!". The child has to correct it. Two things make this work better than
// asking a child to name a picture:
//
//   - It reverses the social roles. The child is the one who knows, and the
//     alien is the one making mistakes, so errors are funny rather than
//     frightening. A child who is not afraid of being wrong will try to speak.
//   - It gives a reason to say the word out loud. "What is this?" is a test;
//     "no, it's a HORSE" is a correction, and corrections come naturally.
//
// Deliberately NOT here: automatic pronunciation scoring. Speech recognition
// on a five-year-old with a Latvian accent is unreliable, and a false "wrong"
// on something the child said perfectly well is the single most discouraging
// thing this app could do. A grown-up confirms, or the child confirms by
// picking the right picture.

import { el, wait } from '../ui/dom.js';
import { pictureEl } from '../media/picture.js';
import { primaryButton } from '../ui/components.js';
import { pickDistractors } from '../core/selector.js';
import { petReact, petSay, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { t } from '../i18n/lv.js';
import * as mic from '../media/mic.js';
import { stageWith } from './base.js';

const ALIEN = '👽';

export function run(ctx) {
  const { round, profile, pool, progress } = ctx;
  const word = round.word;

  // What the alien wrongly calls it — a real word from the same unit, so the
  // mistake is plausible and the correction is about this word specifically.
  const wrong = pickDistractors(word, pool, 1, {
    ageBand: profile.ageBand,
    progress,
  })[0];
  if (!wrong) return Promise.resolve();

  const micAllowed = profile.settings.mic && mic.isSupported();
  const claim = `This is ${article(wrong)}!`;

  return new Promise((resolve) => {
    let finished = false;
    let clip = null;
    let recording = false;

    const picture = pictureEl(word, { size: 'clamp(6rem, 26vw, 11rem)' });
    const alien = el('span.alien', { 'aria-hidden': 'true', text: ALIEN });
    const speech = el('div.alien__says', { text: claim });
    const controls = el('div.sayit__controls');

    /**
     * The child has corrected the alien.
     * @param {boolean} spoke - did they actually say it out loud?
     */
    const settle = async (spoke) => {
      if (finished) return;
      finished = true;
      mic.release();

      play('correct');
      petReact.correct();
      alien.classList.add('is-corrected');
      speech.textContent = `${t('act.teachThanks')} ${word.en}!`;
      await ctx.say(word);
      if (canEnact(word.id)) await enact(picture, word);
      await wait(500);

      // Production is credited only when a grown-up (or the child, on the
      // older track) confirms the word was actually said. Tapping "the alien
      // is wrong" is comprehension, not speech, and is recorded as such.
      ctx.result(word.id, true, 0, {
        activity: spoke ? 'teach' : 'listenTap',
        aided: false,
      });
      resolve();
    };

    // --- Step 1: is the alien right? ---
    const noBtn = el('button.btn.btn--big.btn--primary', {
      type: 'button',
      on: { click: () => { play('tap'); step2(); } },
    }, `🙅 ${t('act.teachNo')}`);

    const yesBtn = el('button.btn.btn--big', {
      type: 'button',
      on: {
        click: async () => {
          // Agreeing with the alien is a wrong answer, handled gently: the
          // alien is delighted to be told, then corrected anyway.
          play('wrong');
          petReact.wrong();
          speech.textContent = t('act.teachReally');
          await wait(900);
          step2();
        },
      },
    }, `🙆 ${t('act.teachYes')}`);

    function step1() {
      setPetPlacement('corner');
      petReact.asking();
      stageWith(
        ctx,
        el('div.prompt', {}, [el('span.prompt__text', { text: t('act.teachTitle') })]),
        el('div.alienrow', {}, [alien, speech]),
        el('div.bigcard', {}, [picture]),
        el('div.home__actions', {}, [noBtn, yesBtn]),
      );
      ctx.sayText(claim);
      petSay('❓', 1600);
    }

    // --- Step 2: tell the alien the right word ---
    function step2() {
      speech.textContent = t('act.teachWhat');
      ctx.sayText('What is it?');

      const sayBtn = primaryButton(t('act.teachSaid'), () => settle(true), { emoji: '🗣️' });

      // Toddlers do not self-report. A grown-up confirms, which is also the
      // moment they hear the child say it — the part that actually matters.
      const confirmLabel = profile.ageBand === 2 || profile.settings.coPlay
        ? t('act.teachGrownupConfirm')
        : t('act.teachSaid');
      sayBtn.querySelector('span:last-child').textContent = confirmLabel;

      clearChildren(controls);
      if (micAllowed) controls.append(recordButton());

      stageWith(
        ctx,
        el('div.prompt', {}, [el('span.prompt__text', { text: t('act.teachTitle') })]),
        el('div.alienrow', {}, [alien, speech]),
        el('div.bigcard', {}, [
          picture,
          profile.ageBand === 5 ? el('span.bigcard__word', { text: word.en }) : null,
        ]),
        controls,
        el('div.home__actions', {}, [
          sayBtn,
          el('button.btn', {
            type: 'button',
            on: { click: () => { play('tap'); ctx.say(word); } },
          }, `🔊 ${t('act.listenAgain')}`),
          el('button.btn.btn--ghost', {
            type: 'button',
            on: { click: () => settle(false) },
          }, t('btn.skip')),
        ]),
      );

      // Model it once so the child has something to copy.
      ctx.say(word);
    }

    function recordButton() {
      const button = el('button.btn.recbtn', {
        type: 'button',
        on: { click: () => toggle() },
      }, [el('span.recbtn__dot'), el('span.recbtn__label', { text: t('act.sayItRecord') })]);

      async function toggle() {
        if (recording) {
          recording = false;
          button.classList.remove('is-recording');
          button.querySelector('.recbtn__label').textContent = t('act.sayItRecord');
          clip = await mic.stop();
          if (clip) {
            await wait(200);
            await ctx.say(word);          // the model...
            await wait(200);
            await mic.playback(clip);      // ...then the child, back to back
          }
          return;
        }
        const started = await mic.start();
        if (!started.ok) { button.remove(); return; }
        recording = true;
        button.classList.add('is-recording');
        button.querySelector('.recbtn__label').textContent = t('act.sayItStop');
      }

      return button;
    }

    step1();
  });
}

const article = (word) => (word.art ? `${word.art} ${word.en}` : word.en);

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
