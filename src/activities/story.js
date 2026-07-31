// The story adventure.
//
// A character has a problem, stated in English. Understanding the sentence is
// what moves the story on. Getting it right does not score a point — it changes
// what happens, which is the only reward the child sees.
//
// This used to be a separate segment near the end of the session, with its own
// layout, which meant the best part of the app arrived at round fifteen of
// eighteen and everything before it was the price of admission. It now runs on
// the same scene the whole visit has taken place in: the hero walks into the
// place the child is already standing in, and the backdrop shifts as the story
// moves. Its layout became the shared one — this screen was always the part
// that felt like somewhere rather than something.
//
// Two rules the scene enforces, both from the research notes:
//   - nothing is clickable except the answers, so there is no reward for
//     poking around hunting for animations
//   - the scene stays plain; a busy background competes with the thing the
//     child is supposed to be looking at
//
// The whole story runs as ONE round: splitting it into three would put a round
// transition through the middle of a narrative, which is exactly how you turn a
// story back into a quiz.

import { wait } from '../ui/dom.js';
import { castEl } from '../ui/sceneStage.js';
import { petReact } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { idleHint, TEACH_AFTER_MISSES } from './base.js';

export async function run(ctx) {
  const { round, scene } = ctx;
  const { story, scenes } = round;
  if (!story || !scenes?.length) return;

  const hero = castEl(story.hero, { kind: 'hero' });
  scene.clearProps();
  scene.clearExtra();
  scene.setCast(hero);

  await titleCard(ctx, story);
  for (const sceneStep of scenes) {
    if (ctx.aborted?.()) break;
    await playScene(ctx, story, sceneStep, hero);
  }
  await endCard(ctx, story);

  scene.clearCast();
  petReact.idle();
}

/** Opening: who this is about and what the problem is. */
async function titleCard(ctx, story) {
  const { scene } = ctx;
  await scene.setMood(story.mood);
  scene.say(story.intro, story.introLv);
  play('pop');
  petReact.asking();
  await ctx.sayText(story.intro);
  await wait(600);
}

/** One scene: hear the problem, pick the thing that solves it. */
function playScene(ctx, story, step, hero) {
  const { scene } = ctx;
  const word = step.word;
  // The template carries its own determiner ("Find the ___"), so the slot
  // takes the bare word — otherwise it reads "Find the a cat".
  const sentence = step.ask.replace('___', word.en);

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const props = scene.setProps(step.options, {
      showText: ctx.profile.ageBand === 5,
      onPick: (option) => pick(option),
    });

    const ask = async () => {
      hint.cancel();
      await ctx.sayText(sentence);
      askedAt = performance.now();
      hint = idleHint(ctx.profile, () => {
        aided = true;
        props.hint(word.id);
      });
    };

    async function pick(option) {
      if (done) return;
      hint.cancel();
      attempts += 1;

      if (option.id !== word.id) {
        play('wrong');
        await props.markWrong(option.id);

        if (attempts >= TEACH_AFTER_MISSES) {
          // Stop testing, start teaching: name it, show what it means, and
          // let the child move the story on.
          aided = true;
          props.hint(word.id);
          await ctx.say(word);
          const pic = props.pictureOf(word.id);
          if (pic && canEnact(word.id)) await enact(pic, word);
        } else {
          await ask();
        }
        return;
      }

      done = true;
      play('correct');
      await props.markCorrect(word.id);

      // The story reacts. This is the payoff — not a score, an outcome.
      const pic = props.pictureOf(word.id);
      if (pic && canEnact(word.id)) await enact(pic, word);
      hero.classList.add('is-pleased');
      scene.say(step.win, step.lv);
      await ctx.sayText(step.win);
      hero.classList.remove('is-pleased');

      ctx.result(word.id, attempts === 1 && !aided, Math.round(performance.now() - askedAt), {
        activity: 'story',
        aided,
      });
      await wait(700);
      resolve();
    }

    (async () => {
      await scene.setMood(step.mood || story.mood);
      scene.say(sentence, step.lv);
      await ask();
    })();
  });
}

/** Closing. */
async function endCard(ctx, story) {
  const { scene } = ctx;
  scene.clearProps();
  await scene.setMood(story.mood);
  scene.say(story.outro, story.outroLv);
  play('celebrate');
  petReact.celebrate();
  await ctx.sayText(story.outro);
  await wait(900);
}
