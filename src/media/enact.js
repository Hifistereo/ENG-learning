// Meaning-matched animation.
//
// The metaanalysis point this implements: animation helps comprehension when
// it depicts the meaning of the word, and hurts when it is decorative motion
// competing for the same attention. So "jump" hops, "eat" disappears into a
// mouth, "big" grows, "sleep" fades with a 💤 — and nothing else on the screen
// moves while it happens.
//
// This replaces screen-wide confetti as the response to a correct answer. A
// burst of stars tells the child they were right; a picture acting out its own
// word tells them what the word means, which is the thing we are here to do.

import { prefersReducedMotion } from '../ui/dom.js';

/**
 * How each word's meaning is depicted. Keyed by word id.
 *
 * Only words whose meaning is genuinely depictable belong here. A generic
 * wiggle on a noun is decorative motion, which is the thing to avoid — if
 * there is no honest enactment, the entry is simply absent and the picture
 * stays still.
 */
const ENACTMENTS = {
  // Verbs — the clearest case, and where this matters most.
  jump:  'enact-jump',
  run:   'enact-run',
  walk:  'enact-walk',
  dance: 'enact-dance',
  sleep: 'enact-sleep',
  eat:   'enact-eat',
  drink: 'enact-drink',
  clap:  'enact-clap',
  swim:  'enact-swim',
  sing:  'enact-sing',
  wash:  'enact-wash',
  read:  'enact-read',

  // Feelings: the face grows into the emotion.
  happy:  'enact-bounce',
  sad:    'enact-droop',
  angry:  'enact-shake',
  tired:  'enact-droop',
  scared: 'enact-shake',
  love:   'enact-beat',
  funny:  'enact-wobble',

  // A few nouns whose meaning is motion.
  rain:  'enact-fall',
  snow:  'enact-fall',
  wind:  'enact-sway',
  star:  'enact-twinkle',
  sun:   'enact-twinkle',
  ball:  'enact-bounce',
  car:   'enact-run',
  bus:   'enact-run',
  train: 'enact-run',
  plane: 'enact-fly',
  bird:  'enact-fly',
  fish:  'enact-swim',
  boat:  'enact-sway',
  bike:  'enact-run',
  clock: 'enact-tick',
  door:  'enact-open',
};

/** Companion emoji shown alongside some enactments to complete the meaning. */
const COMPANION = {
  sleep: '💤',
  eat: '👄',
  drink: '👄',
  sing: '🎵',
  wash: '🫧',
  rain: '💧',
  snow: '❄️',
};

export const canEnact = (wordId) => !!ENACTMENTS[wordId];

/**
 * Act out a word's meaning on its picture element.
 *
 * Resolves when the animation finishes, so callers can sequence it against
 * speech. Always resolves — a missing enactment or reduced-motion setting
 * just returns immediately rather than blocking the round.
 *
 * @param {HTMLElement} node - the element showing the word's picture
 * @param {object} word
 * @param {{repeat?: number}} [opts]
 */
export function enact(node, word, { repeat = 1 } = {}) {
  const animation = ENACTMENTS[word?.id];
  if (!node || !animation) return Promise.resolve(false);

  // Under reduced motion we show the companion emoji but skip the movement:
  // the meaning cue survives, the motion does not.
  if (prefersReducedMotion()) {
    addCompanion(node, word, 1400);
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      node.classList.remove('enacting', animation);
      node.style.removeProperty('--enact-repeat');
      node.removeEventListener('animationend', finish);
      resolve(true);
    };

    addCompanion(node, word, 1600);
    node.style.setProperty('--enact-repeat', String(repeat));
    node.classList.add('enacting', animation);
    node.addEventListener('animationend', finish);
    setTimeout(finish, 900 * repeat + 600);   // never wedge a round
  });
}

function addCompanion(node, word, ms) {
  const emoji = COMPANION[word?.id];
  if (!emoji) return;
  const span = document.createElement('span');
  span.className = 'enact-companion';
  span.textContent = emoji;
  span.setAttribute('aria-hidden', 'true');
  node.appendChild(span);
  setTimeout(() => span.remove(), ms);
}
