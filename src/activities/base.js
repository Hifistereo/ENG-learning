// Shared plumbing for activities.
//
// Every activity is `run(ctx) => Promise<void>` and resolves when its round is
// over. The play screen owns the loop; activities never navigate or advance
// the session themselves.
//
// ctx = {
//   scene,      the visit's scene stage — see ui/sceneStage.js. Persistent for
//               the whole session: an activity changes what is said and what
//               is on the shelf, and never tears anything down.
//   stage,      the raw stage element, for the two rounds outside the visit
//   round,      the round descriptor from core/session.js
//   profile, progress, pool,
//   say(word) / sayText(text),
//   result(wordId, ok, ms),   record a scored answer
//   aborted(),  true once the child has left
//   quit(),
// }

import { clear, wait } from '../ui/dom.js';
import { petReact } from '../pet/pet.js';
import { enact, canEnact } from '../media/enact.js';

/** Seconds of no answer before the pet offers a hint. */
export const HINT_AFTER_MS = { 2: 6000, 5: 9000 };

/**
 * Start an idle timer that nudges the child if nothing happens.
 * @returns {{cancel: Function}}
 */
export function idleHint(profile, onHint) {
  if (!profile.settings.petHints) return { cancel() {} };
  const delay = HINT_AFTER_MS[profile.ageBand] ?? HINT_AFTER_MS[5];
  const timer = setTimeout(onHint, delay);
  return { cancel: () => clearTimeout(timer) };
}

/**
 * Render helper: wipe the stage and drop in the activity's nodes.
 *
 * Only for the two rounds that happen outside the visit — the co-play card,
 * which is addressed to the adult before the session starts. Everything inside
 * the visit renders through ctx.scene and never clears anything.
 */
export function stageWith(ctx, ...nodes) {
  clear(ctx.stage).append(...nodes.filter(Boolean));
  return ctx.stage;
}

/**
 * Teach the answer after repeated misses.
 *
 * The rule this implements: a wrong answer must never end in a cross and a
 * shrug. Say the right word, show what it means, then hand the child an easy
 * success. From here on the round is aided, so nothing it produces counts as
 * evidence — but the child still finishes on a win, which is what keeps them
 * tapping tomorrow.
 *
 * @param {object} ctx
 * @param {object} word
 * @param {object} props - the shelf handle from sceneStage.setProps
 * @param {string} [answerId] - defaults to the word's id
 */
export async function teachAnswer(ctx, word, props, answerId = word.id) {
  petReact.hint(props.directionOf(answerId));
  props.hint(answerId);
  await ctx.say(word);

  const node = props.pictureOf(answerId);
  if (node && canEnact(word.id)) await enact(node, word);
  else await wait(500);

  petReact.idle();
}

/** How many misses before we stop asking and start teaching. */
export const TEACH_AFTER_MISSES = 2;
