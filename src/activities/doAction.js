// "Jump with me!" — movement, then retrieval.
//
// The old TPR round was a break: the pet said a verb, the child copied it,
// tapped "done", and nothing was learned that we could measure. Linking a word
// to the child's own body is one of the best-evidenced techniques there is, so
// it deserves better than being unscored filler.
//
// Two phases:
//   1. DO — the pet gives a command and acts it out; the child copies it.
//      Unscored, because tapping "I did it" is a self-report.
//   2. CHOOSE — a command is spoken and the child picks which of several
//      acted-out pictures matches. This IS scored: it is a real retrieval,
//      and the child has just felt the meaning in their own body.
//
// Phase 2 is what makes the movement count. The child moves, then has to
// retrieve — which is the combination the research points at.
//
// Both phases now happen in the scene rather than on a cleared screen with the
// pet parked in a corner: the pet does the thing where it stands, and the
// answers are the other characters doing things around it.

import { el, wait } from '../ui/dom.js';
import { primaryButton } from '../ui/components.js';
import { pictureEl } from '../media/picture.js';
import { tprWords } from '../data/words.js';
import { pickDistractors, CHOICE_COUNT } from '../core/selector.js';
import { petReact, petSay } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { chatter } from '../data/chatter.js';
import { t } from '../i18n/lv.js';
import { idleHint, teachAnswer, TEACH_AFTER_MISSES } from './base.js';

/** How many times the pet calls the command before handing over. */
const CALLS = 2;

export async function run(ctx) {
  const word = ctx.round.word;
  if (!word) return;

  await doPhase(ctx, word);
  if (ctx.round.skipRetrieval) return;
  await choosePhase(ctx, word);
}

/** Phase 1: the pet commands and demonstrates; the child copies. */
function doPhase(ctx, word) {
  const { scene, profile } = ctx;

  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      petReact.correct();
      play('correct');
      resolve();
    };

    // "Jump! Jump with me!" — an invitation from a character, which is a
    // different thing from an instruction printed above a picture.
    const sentence = `${capitalise(word.en)}! ${capitalise(word.en)} with me!`;

    const picture = pictureEl(word, {
      size: 'clamp(4.5rem, 20vw, 7.5rem)',
      className: 'cast cast--action',
    });

    scene.clearProps();
    scene.setCast(picture);
    scene.say(sentence, t('say.doIt'));
    scene.setExtra(
      profile.ageBand === 2 && profile.settings.coPlay !== false
        ? el('p.coplay-nudge', { text: t('act.grownupDo') })
        : null,
      primaryButton(t('act.tprDone'), done, { emoji: '🙌' }),
    );

    petReact.dancing();

    (async () => {
      for (let i = 0; i < CALLS && !finished; i += 1) {
        petSay(word.en, 1500);
        await ctx.sayText(i === 0 ? sentence : word.en);
        // The picture performs the verb, so the command and its meaning arrive
        // together rather than the child having to guess from a static image.
        if (canEnact(word.id)) await enact(picture, word, { repeat: 2 });
        await wait(700);
      }
    })();
  });
}

/**
 * Phase 2: hear a command, pick who is doing it.
 *
 * This is the scored half. The child has just performed the verb, so the
 * question is asked at the moment the meaning is most physically available.
 */
function choosePhase(ctx, word) {
  const { profile, progress, scene } = ctx;
  const actions = tprWords(profile.ageBand);
  const choices = Math.min(CHOICE_COUNT[profile.ageBand] ?? 3, actions.length);

  const distractors = pickDistractors(word, actions, choices - 1, {
    ageBand: profile.ageBand,
    progress,
  });
  if (!distractors.length) return Promise.resolve();

  const options = [word, ...distractors].sort(() => Math.random() - 0.5);
  const sentence = `Who is ${gerund(word.en)}?`;

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    scene.clearCast();
    scene.clearExtra();
    scene.say(sentence, t('say.whoIsDoing'));

    const props = scene.setProps(options, {
      showText: profile.ageBand === 5,
      onPick: (picked) => onPick(picked),
    });

    // Every option acts out its own verb continuously, so the child is
    // choosing between meanings rather than between static pictures.
    for (const option of options) {
      const node = props.pictureOf(option.id);
      if (node && canEnact(option.id)) enact(node, option, { repeat: 999 });
    }

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await ctx.sayText(sentence);
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;
        petReact.hint(props.directionOf(word.id));
        props.hint(word.id);
      });
    };

    async function onPick(picked) {
      if (done) return;
      hint.cancel();
      attempts += 1;

      if (picked.id !== word.id) {
        play('wrong');
        petReact.wrong();
        await props.markWrong(picked.id);
        if (attempts >= TEACH_AFTER_MISSES) {
          aided = true;
          await teachAnswer(ctx, word, props);
        } else {
          await ask();
        }
        return;
      }

      done = true;
      props.lock();
      play('correct');
      petReact.correct();

      const yes = chatter('yes', { mood: scene.mood });
      if (yes) {
        petSay(yes.en, 1600);
        scene.say(`${yes.en} ${capitalise(gerund(word.en))}!`, yes.lv);
        ctx.sayText(`${yes.en} ${capitalise(gerund(word.en))}!`);
      } else {
        ctx.say(word);
      }
      await props.markCorrect(word.id);

      const clean = attempts === 1 && !aided;
      ctx.result(word.id, clean, Math.round(performance.now() - askedAt), {
        activity: 'doAction',
        aided,
      });
      resolve();
    }

    ask();
  });
}

/**
 * "jump" → "jumping". Only the three English spelling rules that the action
 * words in this curriculum actually need — this is not a general conjugator,
 * and it must never invent a form a child would then hear wrong.
 */
function gerund(verb) {
  if (/[^aeiou]e$/.test(verb)) return `${verb.slice(0, -1)}ing`;      // dance → dancing
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(verb)) return `${verb}${verb.slice(-1)}ing`; // run → running
  return `${verb}ing`;
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
