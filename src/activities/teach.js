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
//
// The alien now lands in the scene the child has spent the whole visit in,
// rather than appearing on a blank page. It is also where two more retired
// greeting words live: the child's "No! Look again." and the alien's "Sorry!
// You are right." Both are said at the only moment either phrase means
// anything, and neither is ever quizzed. See data/chatter.js.

import { el, wait } from '../ui/dom.js';
import { pictureEl } from '../media/picture.js';
import { primaryButton } from '../ui/components.js';
import { castEl } from '../ui/sceneStage.js';
import { pickDistractors } from '../core/selector.js';
import { petReact, petSay } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { chatter } from '../data/chatter.js';
import { t } from '../i18n/lv.js';
import * as mic from '../media/mic.js';

const ALIEN = { id: 'alien', emoji: '👽' };

export function run(ctx) {
  const { round, profile, pool, progress, scene } = ctx;
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

    const picture = pictureEl(word, {
      size: 'clamp(4.5rem, 20vw, 7.5rem)',
      className: 'cast cast--newword',
    });
    const alien = castEl(ALIEN, { kind: 'char', size: 'clamp(3.5rem, 15vw, 6rem)' });
    alien.classList.add('cast--alien');

    scene.clearProps();
    scene.setCast(alien, picture);

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

      // "Sorry! You are right." — an apology for having been wrong, which is
      // exactly what sorry is for, and the child is the one owed it.
      const sorry = chatter('sorry', { mood: scene.mood });
      const line = sorry ? `${sorry.en} ${capitalise(article(word))}!` : `${capitalise(article(word))}!`;
      scene.say(line, sorry ? sorry.lv : word.lv);
      await ctx.sayText(line);
      if (canEnact(word.id)) await enact(picture, word);
      await wait(500);

      // Production is credited only when a grown-up (or the child, on the
      // older track) confirms the word was actually said. Tapping "the alien
      // is wrong" is comprehension, not speech, and is recorded as such.
      ctx.result(word.id, true, 0, {
        activity: spoke ? 'teach' : 'listenTap',
        aided: false,
      });
      scene.clearCast();
      scene.clearExtra();
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
          scene.say('Really? Let us look again…', t('act.teachReally'));
          await wait(900);
          step2();
        },
      },
    }, `🙆 ${t('act.teachYes')}`);

    function step1() {
      petReact.asking();
      scene.say(claim, `Šis ir ${wrong.lv}!`);
      scene.setExtra(el('div.home__actions', {}, [noBtn, yesBtn]));
      ctx.sayText(claim);
      petSay('❓', 1600);
    }

    // --- Step 2: tell the alien the right word ---
    function step2() {
      // The pet says "no" on the child's behalf, out loud, in the one place
      // where contradicting someone is the correct and useful thing to do.
      const no = chatter('no', { mood: scene.mood });
      scene.say(no ? no.en : 'What is it?', no ? no.lv : 'Kas tas ir?');
      ctx.sayText(no ? `${no.en} What is it?` : 'What is it?');

      const sayBtn = primaryButton(t('act.teachSaid'), () => settle(true), { emoji: '🗣️' });

      // Toddlers do not self-report. A grown-up confirms, which is also the
      // moment they hear the child say it — the part that actually matters.
      const confirmLabel = profile.ageBand === 2 || profile.settings.coPlay
        ? t('act.teachGrownupConfirm')
        : t('act.teachSaid');
      sayBtn.querySelector('span:last-child').textContent = confirmLabel;

      if (profile.ageBand === 5) {
        picture.insertAdjacentElement('afterend',
          el('span.cast__word', { text: word.en }));
      }

      scene.setExtra(
        micAllowed ? el('div.sayit__controls', {}, [recordButton()]) : null,
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
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
