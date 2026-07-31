// Leaving the place.
//
// The visit needs an ending that belongs to the story rather than to the
// software. There is no progress bar any more, so this is how a child finds out
// the session is over: the pet waves from the scene and says goodbye, and then
// the celebration happens.
//
// It is also where `bye` and `good night` are learned — said on the way out,
// every time, which is the only situation either phrase belongs to. In a night
// scene it is "Good night!" and nowhere else. See data/chatter.js.

import { wait } from '../ui/dom.js';
import { petReact, petSay } from '../pet/pet.js';
import { chatter } from '../data/chatter.js';

export async function run(ctx) {
  const { scene } = ctx;
  if (!scene) return;

  scene.clearProps();
  scene.clearExtra();
  scene.clearCast();

  const bye = chatter('leave', { mood: scene.mood });
  if (!bye) return;

  petReact.dancing();
  petSay(bye.en, 2600);
  scene.say(bye.en, bye.lv);
  await ctx.sayText(bye.en);
  await wait(700);
  petReact.idle();
}
