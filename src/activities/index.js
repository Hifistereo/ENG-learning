// Activity registry. The play screen looks a round's type up here and awaits
// the result; nothing else needs to know which activities exist.
//
// The memory board was removed in v0.2.0: it was a memory game wearing a
// language costume. A child can win it by tracking card positions without
// processing a word of English, which makes both the practice and the score
// meaningless.

import * as listenTap from './listenTap.js';
import * as intro from './intro.js';
import * as chant from './chant.js';
import * as doAction from './doAction.js';
import * as phonics from './phonics.js';
import * as sentence from './sentence.js';
import * as order from './order.js';
import * as transfer from './transfer.js';
import * as teach from './teach.js';
import * as story from './story.js';
import * as coplay from './coplay.js';

export const ACTIVITIES = {
  // Meeting a word
  intro,
  chant,
  // Understanding it
  listenTap,
  order,
  story,
  doAction,
  // Proving it is the word and not the picture
  transfer,
  // Saying it
  teach,
  // Literacy, age 5
  phonics,
  sentence,
  // Framing
  coplay,
};

/** @returns {(ctx: object) => Promise<void>} */
export function activityFor(type) {
  return ACTIVITIES[type]?.run || null;
}
