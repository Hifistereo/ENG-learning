// "Give me the apple, please." — the order-fulfilment game.
//
// Structurally this is a comprehension question, but the framing does real
// work. The child is not being tested; someone wants something and only
// understanding the English gets it for them. Then the character actually uses
// the thing — eats the apple, wears the hat, drives away — so the payoff for
// understanding is the meaning being acted out, rather than a point.
//
// That last part is the whole design: the reward has to be the language
// working, or the child learns to play for the reward instead.
//
// It is also where two of the retired greeting words now live. "Please" ends
// the request and "thank you" answers the handover, every single time, in the
// one situation that gives either phrase its meaning. That is how those two
// words are actually learned — not by picking a praying-hands emoji out of a
// line-up. See data/chatter.js.
//
// Difficulty grows with what the child knows, in the progression from the
// research notes: one item shown → choose from two → choose from four →
// modified by a colour or number.

import { wait } from '../ui/dom.js';
import { buildQuestion } from '../core/selector.js';
import { getWord, withArticle } from '../data/words.js';
import { canOrder } from '../data/units.js';
import { chatter } from '../data/chatter.js';
import { hasEvidence } from '../core/knowledge.js';
import { petReact, petSay } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { idleHint, teachAnswer, TEACH_AFTER_MISSES } from './base.js';

/** How the character uses each kind of thing once it has been handed over. */
const USES = {
  food:     { emoji: '😋', enact: 'eat',    lv: 'apēd' },
  clothes:  { emoji: '😎', enact: null,     lv: 'uzvelk' },
  toys:     { emoji: '🥳', enact: 'bounce', lv: 'spēlējas' },
  animals:  { emoji: '🤗', enact: null,     lv: 'samīļo' },
  vehicles: { emoji: '🚀', enact: 'run',    lv: 'brauc' },
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
  const { round, profile, pool, progress, scene } = ctx;
  const word = round.word;

  // Defensive: the planner filters these out, but never build a sentence no
  // English speaker would say.
  if (!canOrder(word)) return import('./listenTap.js').then((m) => m.run(ctx));

  const question = buildQuestion(word, pool, { ageBand: profile.ageBand, progress });
  const modifier = profile.ageBand === 5 ? pickModifier(word, progress) : null;

  const please = chatter('ask', { mood: scene.mood });
  const item = modifier ? `the ${modifier.en} ${word.en}` : withArticle(word);
  const request = `Give me ${item}, ${(please?.en || 'please!').toLowerCase()}`;
  const requestLv = `Iedod man ${modifier ? `${modifier.lv} ` : ''}${word.lv}, lūdzu!`;

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    scene.say(request, requestLv);
    const props = scene.setProps(question.options, {
      showText: profile.ageBand === 5,
      onPick: (picked) => onPick(picked),
    });

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      petSay(please?.en || 'Please!', 3000);
      await ctx.sayText(request);
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;
        petReact.hint(props.directionOf(word.id));
        props.hint(word.id);
      });
    };

    /** The character takes the item, thanks the child, and uses it. */
    async function useItem() {
      const use = USES[word.unit] || { emoji: '✨', enact: null };

      // "Thank you!" the instant the thing changes hands.
      const thanks = chatter('thank', { mood: scene.mood });
      if (thanks) {
        petSay(thanks.en, 2000);
        scene.say(thanks.en, thanks.lv);
        await ctx.sayText(thanks.en);
      }

      const picture = props.pictureOf(word.id);
      if (picture) {
        picture.classList.add('prop__pic--taken');
        play('pop');
        await wait(420);
        if (canEnact(word.id)) await enact(picture, word);
        else if (use.enact) {
          picture.classList.add('enacting', `enact-${use.enact}`);
          await wait(900);
        }
      }

      petSay(use.emoji, 1400);
      await wait(300);
    }

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
      await props.markCorrect(word.id);

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

    ask();
  });
}
