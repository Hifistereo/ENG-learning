// The pet shows you around.
//
// Rhythmic naming of words the child already knows. It does three things at
// once: it opens the visit on guaranteed success, it primes the vocabulary
// about to be reviewed, and the steady beat plus the pet bouncing is what makes
// a 2-year-old want to join in out loud.
//
// It used to be a row of cards under the heading "Atkārtojam!" — Let's repeat!
// — which is an instruction to practise, and the first thing the child saw
// every session. Now the pet walks around the place pointing things out: "Look!
// A cat." Same words, same rhythm, same repetition; the difference is that
// pointing at things you recognise is a game a toddler already plays.
//
// Unscored — nothing here is a question.

import { el, wait } from '../ui/dom.js';
import { petReact } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { withArticle } from '../data/words.js';
import { chatter } from '../data/chatter.js';
import { t } from '../i18n/lv.js';

/** Times through the list of words. */
const ROUNDS = 2;

/**
 * Silence between one thing being pointed at and the next.
 *
 * `say()` already holds a beat after every line, so this is the gap on top of
 * that. It used to be 160–260 ms, which at four words times two passes made
 * the opening of every session sound like a list being read out.
 */
const BEAT_MS = 450;

export async function run(ctx) {
  const { scene, profile } = ctx;
  const words = ctx.round.words || [];
  if (!words.length) return;

  scene.clearProps();
  scene.clearExtra();
  petReact.dancing();

  // "Hello! Look!" — the greeting lands on arrival, where it means something.
  const greeting = chatter('arrive', { mood: scene.mood });
  if (greeting) {
    scene.say(greeting.en, greeting.lv);
    await ctx.sayText(greeting.en);
    await wait(300);
  }

  const holders = scene.showProps(words);

  for (let pass = 0; pass < ROUNDS; pass += 1) {
    for (const [i, word] of words.entries()) {
      if (ctx.aborted?.()) return;
      const holder = holders[i];
      holder.classList.add('is-active');
      play('beat');

      // The frame is worth hearing, but not four times in a row. Only the
      // first thing pointed at gets "Look! A cat." — after that the pattern is
      // established and the child needs the noun, not the sentence around it.
      // This round is the very first thing in a session, and saying the whole
      // frame every time made the app open with a wall of speech.
      const named = pass === 0 && i === 0;
      const line = named ? `Look! ${capitalise(withArticle(word))}.` : word.en;
      scene.say(line, named ? t('say.thisIs', { word: word.lv }) : word.lv);
      await ctx.sayText(line);
      await wait(pass === 0 ? BEAT_MS : BEAT_MS * 0.6);  // a touch quicker second time
      holder.classList.remove('is-active');
    }
    if (pass === 0) await wait(BEAT_MS);      // a breath between the two passes
  }

  if (profile.ageBand === 2 && profile.settings.coPlay !== false) {
    // The grown-up chanting along is the whole mechanism at this age.
    scene.setExtra(el('p.coplay-nudge', { text: t('act.grownupDo') }));
  }

  petReact.idle();
  await wait(300);
  scene.clearProps();
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
