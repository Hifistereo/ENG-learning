// Activity registry. The play screen looks a round's type up here and awaits
// the result; nothing else needs to know which activities exist.

import * as listenTap from './listenTap.js';
import * as intro from './intro.js';
import * as chant from './chant.js';
import * as tpr from './tpr.js';
import * as phonics from './phonics.js';
import * as sentence from './sentence.js';
import * as memory from './memory.js';
import * as sayIt from './sayIt.js';

export const ACTIVITIES = {
  listenTap,
  intro,
  chant,
  tpr,
  phonics,
  sentence,
  memory,
  sayIt,
};

/** @returns {(ctx: object) => Promise<void>} */
export function activityFor(type) {
  return ACTIVITIES[type]?.run || null;
}
