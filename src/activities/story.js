// The story adventure.
//
// A character has a problem, stated in English. Three pictures; understanding
// the sentence is what moves the story on. Getting it right does not score a
// point — it changes what happens, which is the only reward the child sees.
//
// Two rules the scene layout enforces, both from the research notes:
//   - nothing is clickable except the answers, so there is no reward for
//     poking around hunting for animations
//   - the scene stays plain; a busy background competes with the thing the
//     child is supposed to be looking at
//
// The whole story runs as ONE round. Splitting it into three would put a
// progress bar and a round transition through the middle of a narrative, which
// is exactly how you turn a story back into a quiz.

import { el, wait } from '../ui/dom.js';
import { pictureEl } from '../media/picture.js';
import { sceneEl, heroEl } from '../media/scene.js';
import { primaryButton } from '../ui/components.js';
import { petReact, showPet } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { t } from '../i18n/lv.js';
import { stageWith, idleHint, TEACH_AFTER_MISSES } from './base.js';

export async function run(ctx) {
  const { round, profile } = ctx;
  const { story, scenes } = round;
  if (!story || !scenes?.length) return;

  // The pet steps aside: this story has its own character, and two companions
  // on screen is one too many.
  showPet(false);

  await titleCard(ctx, story);
  for (const scene of scenes) {
    if (ctx.aborted?.()) break;
    await playScene(ctx, story, scene);
  }
  await endCard(ctx, story);

  showPet(true);
  petReact.idle();
}

/** Opening card: who this is about and what the problem is. */
async function titleCard(ctx, story) {
  const { profile } = ctx;
  stageWith(
    ctx,
    el('div.storycard', {}, [
      sceneEl(story.mood),
      el('div.storycard__body', {}, [
        heroEl(story.hero, { size: 'clamp(4.5rem, 20vw, 8rem)' }),
        el('h2.storycard__title', { text: story.lv }),
        profile.settings.lvHints
          ? el('p.storycard__lv', { text: story.introLv })
          : null,
      ]),
    ]),
  );
  play('pop');
  await ctx.sayText(story.intro);
  await wait(500);
}

/** One scene: hear the problem, pick the thing that solves it. */
function playScene(ctx, story, scene) {
  const { profile } = ctx;
  const word = scene.word;
  // The template carries its own determiner ("Find the ___"), so the slot
  // takes the bare word — otherwise it reads "Find the a cat".
  const sentence = scene.ask.replace('___', word.en);

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const say = el('p.storyscene__says', { text: profile.ageBand === 5 ? sentence : '' });
    const options = el('div.storyscene__options');
    const buttons = new Map();

    for (const option of scene.options) {
      const button = el('button.storyprop', {
        type: 'button',
        'aria-label': option.en,
        dataset: { id: option.id },
        on: { click: () => pick(option) },
      }, [
        pictureEl(option, { size: 'clamp(3rem, 13vw, 5rem)' }),
        profile.ageBand === 5 ? el('span.storyprop__word', { text: option.en }) : null,
      ]);
      buttons.set(option.id, button);
      options.append(button);
    }

    const ask = async () => {
      hint.cancel();
      await ctx.sayText(sentence);
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;
        buttons.get(word.id)?.classList.add('is-hinted');
      });
    };

    async function pick(option) {
      if (done) return;
      hint.cancel();
      attempts += 1;

      if (option.id !== word.id) {
        play('wrong');
        const button = buttons.get(option.id);
        button.classList.add('is-wrong');
        await wait(500);
        button.classList.remove('is-wrong');
        button.classList.add('is-out');

        if (attempts >= TEACH_AFTER_MISSES) {
          // Stop testing, start teaching: name it, show what it means, and
          // let the child move the story on.
          aided = true;
          const target = buttons.get(word.id);
          target.classList.add('is-hinted');
          await ctx.say(word);
          const pic = target.querySelector('.picture');
          if (pic && canEnact(word.id)) await enact(pic, word);
        } else {
          await ask();
        }
        return;
      }

      done = true;
      play('correct');
      const button = buttons.get(word.id);
      button.classList.add('is-correct');
      buttons.forEach((b) => { if (b !== button) b.classList.add('is-dimmed'); });

      // The story reacts. This is the payoff — not a score, an outcome.
      const pic = button.querySelector('.picture');
      if (pic && canEnact(word.id)) await enact(pic, word);
      say.textContent = scene.win;
      await ctx.sayText(scene.win);

      ctx.result(word.id, attempts === 1 && !aided, Math.round(performance.now() - askedAt), {
        activity: 'story',
        aided,
      });
      await wait(700);
      resolve();
    }

    stageWith(
      ctx,
      el('div.storyscene', {}, [
        sceneEl(scene.mood || story.mood),
        el('div.storyscene__body', {}, [
          heroEl(story.hero),
          say,
          profile.settings.lvHints ? el('p.storyscene__lv', { text: scene.lv }) : null,
        ]),
      ]),
      options,
    );

    ask();
  });
}

/** Closing card. */
async function endCard(ctx, story) {
  stageWith(
    ctx,
    el('div.storycard.storycard--end', {}, [
      sceneEl(story.mood),
      el('div.storycard__body', {}, [
        heroEl(story.hero, { size: 'clamp(5rem, 22vw, 9rem)' }),
        el('h2.storycard__title', { text: story.outroLv }),
      ]),
    ]),
  );
  play('celebrate');
  await ctx.sayText(story.outro);
  await wait(900);
}
