// Shared plumbing for activities.
//
// Every activity is `run(ctx) => Promise<void>` and resolves when its round is
// over. The play screen owns the loop; activities never navigate or advance
// the session themselves.
//
// ctx = {
//   stage,      element to render into (already cleared)
//   round,      the round descriptor from core/session.js
//   profile, progress, pool,
//   say(word) / sayText(text),
//   result(wordId, ok, ms),   record a scored answer
//   quit(),
// }

import { clear } from '../ui/dom.js';
import { petReact } from '../pet/pet.js';

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

/** Render helper: wipe the stage and drop in the activity's nodes. */
export function stageWith(ctx, ...nodes) {
  clear(ctx.stage).append(...nodes.filter(Boolean));
  return ctx.stage;
}

/** Put the pet back to a neutral state between rounds. */
export function restPet() {
  petReact.idle();
}
