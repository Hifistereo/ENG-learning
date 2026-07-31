// "Do it like the animal" — movement, then retrieval.
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

import { el, wait } from '../ui/dom.js';
import { prompt, choiceGrid, primaryButton } from '../ui/components.js';
import { pictureEl } from '../media/picture.js';
import { tprWords } from '../data/words.js';
import { pickDistractors, CHOICE_COUNT } from '../core/selector.js';
import { petReact, petSay, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { t } from '../i18n/lv.js';
import { stageWith, idleHint, teachAnswer, TEACH_AFTER_MISSES } from './base.js';

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

    const picture = pictureEl(word, { size: 'clamp(5rem, 22vw, 9rem)', className: 'tpr__pic' });

    stageWith(
      ctx,
      el('div.prompt', {}, [el('span.prompt__text', { text: t('act.tprTitle') })]),
      el('div.tpr', {}, [
        picture,
        el('span.tpr__word', { text: word.en }),
        ctx.profile.settings.lvHints ? el('span.tpr__lv', { text: word.lv }) : null,
      ]),
      ctx.profile.ageBand === 2 && ctx.profile.settings.coPlay !== false
        ? el('p.coplay-nudge', { text: t('act.grownupDo') })
        : null,
      el('div.stage__footer', {}, [primaryButton(t('act.tprDone'), done, { emoji: '🙌' })]),
    );

    (async () => {
      for (let i = 0; i < CALLS && !finished; i += 1) {
        petSay(word.en, 1500);
        await ctx.say(word);
        // The picture performs the verb, so the command and its meaning arrive
        // together rather than the child having to guess from a static image.
        if (canEnact(word.id)) await enact(picture, word, { repeat: 2 });
        await wait(700);
      }
    })();
  });
}

/**
 * Phase 2: hear a command, pick the action that matches.
 *
 * This is the scored half. The child has just performed the verb, so the
 * question is asked at the moment the meaning is most physically available.
 */
function choosePhase(ctx, word) {
  const { profile, progress } = ctx;
  const actions = tprWords(profile.ageBand);
  const choices = Math.min(CHOICE_COUNT[profile.ageBand] ?? 3, actions.length);

  const distractors = pickDistractors(word, actions, choices - 1, {
    ageBand: profile.ageBand,
    progress,
  });
  if (!distractors.length) return Promise.resolve();

  const options = [word, ...distractors].sort(() => Math.random() - 0.5);

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const grid = choiceGrid(options, {
      ageBand: profile.ageBand,
      showText: profile.ageBand === 5,
      onPick: (picked) => onPick(picked),
    });

    // Every option acts out its own verb continuously, so the child is
    // choosing between meanings rather than between static pictures.
    for (const option of options) {
      const node = grid.root.querySelector(`[data-id="${CSS.escape(option.id)}"] .picture`);
      if (node && canEnact(option.id)) enact(node, option, { repeat: 999 });
    }

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await ctx.say(word);
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;
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
        if (attempts >= TEACH_AFTER_MISSES) {
          aided = true;
          await teachAnswer(ctx, word, grid);
        } else {
          await ask();
        }
        return;
      }

      done = true;
      grid.lock();
      play('correct');
      petReact.correct();
      ctx.say(word);
      await grid.markCorrect(word.id);

      const clean = attempts === 1 && !aided;
      ctx.result(word.id, clean, Math.round(performance.now() - askedAt), {
        activity: 'doAction',
        aided,
      });
      resolve();
    }

    setPetPlacement('corner');
    stageWith(
      ctx,
      prompt(t('act.actionWhich'), { onReplay: () => ctx.say(word) }),
      grid.root,
    );

    ask();
  });
}
