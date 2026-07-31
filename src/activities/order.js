// "Give me the apple" — the order-fulfilment game.
//
// Structurally this is a comprehension question, but the framing does real
// work. The child is not being tested; someone wants something and only
// understanding the English gets it for them. Then the character actually uses
// the thing — eats the apple, wears the hat, throws the ball — so the payoff
// for understanding is the meaning being acted out, rather than a point.
//
// That last part is the whole design: the reward has to be the language
// working, or the child learns to play for the reward instead.
//
// Difficulty grows with what the child knows, in the progression from the
// research notes: one item shown → choose from two → choose from four →
// modified by a colour or number.

import { el, wait } from '../ui/dom.js';
import { prompt, choiceGrid } from '../ui/components.js';
import { pictureEl } from '../media/picture.js';
import { buildQuestion } from '../core/selector.js';
import { getWord, withArticle } from '../data/words.js';
import { canOrder } from '../data/units.js';
import { hasEvidence } from '../core/knowledge.js';
import { petReact, petSay, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { t } from '../i18n/lv.js';
import { stageWith, idleHint, teachAnswer, TEACH_AFTER_MISSES } from './base.js';

/** How the character uses each kind of thing once it has been handed over. */
const USES = {
  food:     { emoji: '😋', enact: 'eat',   lv: 'apēd' },
  clothes:  { emoji: '😎', enact: null,    lv: 'uzvelk' },
  toys:     { emoji: '🥳', enact: 'bounce', lv: 'spēlējas' },
  animals:  { emoji: '🤗', enact: null,    lv: 'samīļo' },
  vehicles: { emoji: '🚀', enact: 'run',   lv: 'brauc' },
};

/**
 * Whether to add a colour word to the request ("give me the RED apple").
 * Only once the child knows both the noun and the colour — stacking an unknown
 * modifier onto an unknown noun tests nothing and teaches less.
 */
function pickModifier(word, progress, rng = Math.random) {
  if (!hasEvidence(progress.words?.[word.id], 'recognise')) return null;
  const colours = ['red', 'blue', 'green', 'yellow']
    .map(getWord)
    .filter((c) => c && hasEvidence(progress.words?.[c.id], 'transfer'));
  if (!colours.length || rng() < 0.65) return null;
  return colours[Math.floor(rng() * colours.length)];
}

export function run(ctx) {
  const { round, profile, pool, progress } = ctx;
  const word = round.word;

  // Defensive: the planner filters these out, but never build a sentence no
  // English speaker would say.
  if (!canOrder(word)) return import('./listenTap.js').then((m) => m.run(ctx));

  const question = buildQuestion(word, pool, {
    ageBand: profile.ageBand,
    progress,
  });
  const modifier = profile.ageBand === 5 ? pickModifier(word, progress) : null;

  // "Give me a cat" / "Give me the red apple."
  const request = modifier
    ? `Give me the ${modifier.en} ${word.en}.`
    : `Give me ${withArticle(word)}.`;

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    const basket = el('div.basket', {}, [
      el('span.basket__mouth', { 'aria-hidden': 'true', text: '🧺' }),
    ]);

    const grid = choiceGrid(question.options, {
      ageBand: profile.ageBand,
      showText: profile.ageBand === 5,
      onPick: (picked) => onPick(picked),
    });

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      petSay(request, 3000);
      await ctx.sayText(request);
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;
        petReact.hint(grid.directionOf(word.id));
        grid.hint(word.id);
      });
    };

    /** The character takes the item and does something with it. */
    async function useItem() {
      const use = USES[word.unit] || { emoji: '✨', enact: null };
      const flying = el('span.basket__item', { 'aria-hidden': 'true', text: word.emoji });
      basket.append(flying);
      play('pop');
      await wait(420);

      const picture = flying;
      if (canEnact(word.id)) await enact(picture, word);
      else if (use.enact) {
        picture.classList.add('enacting', `enact-${use.enact}`);
        await wait(900);
      }

      petSay(use.emoji, 1400);
      await wait(300);
      flying.remove();
    }

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
      await grid.markCorrect(word.id);

      // The point of the whole activity: the character uses the thing, so the
      // payoff is the meaning rather than a score.
      await useItem();
      petReact.correct();

      const clean = attempts === 1 && !aided;
      ctx.result(word.id, clean, Math.round(performance.now() - askedAt), {
        activity: 'order',
        aided,
      });
      resolve();
    }

    setPetPlacement('corner');
    stageWith(
      ctx,
      prompt(t('act.orderTitle'), { onReplay: () => ctx.sayText(request) }),
      profile.ageBand === 5
        ? el('div.request', {}, [el('span.request__text', { text: request })])
        : null,
      basket,
      grid.root,
    );

    ask();
  });
}
