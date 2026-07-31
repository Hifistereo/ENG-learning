// The pet companion.
//
// The pet is not decoration. For a 2-year-old it is the reason the audio has
// somewhere to come from: a disembodied voice asking "where is the cat?" is
// much easier to ignore than a character who leans in and asks. It also
// carries every piece of feedback the app gives, which is how we avoid ever
// needing a red X.
//
// One instance is mounted into #pet-layer at startup and survives navigation.
// Screens call setState()/react(); nothing else touches its DOM.

import { el, clear, prefersReducedMotion } from '../ui/dom.js';
import { getPet, getAccessory, MOOD, petLevel } from '../data/pets.js';
import { hasArt, artUrl } from '../media/art.js';

/** How long each transient state shows before falling back to idle. */
const HOLD_MS = {
  ask: 0,          // held until the activity says otherwise
  point: 0,
  cheer: 1400,
  encourage: 1600,
  dance: 0,
  celebrate: 3000,
  sleep: 0,
  idle: 0,
};

const VALID = new Set(['idle', 'ask', 'point', 'cheer', 'encourage', 'dance', 'celebrate', 'sleep']);

let root = null;      // the positioned wrapper
let body = null;      // the animated sprite
let moodEl = null;
let accessoryEl = null;
let current = 'idle';
let holdTimer = null;
let profile = null;

/** Mount once, from main.js. Safe to call again — it re-renders in place. */
export function mountPet(layer, activeProfile) {
  profile = activeProfile;
  root = el('div.pet', { dataset: { state: 'idle' } });
  body = el('div.pet__body');
  accessoryEl = el('div.pet__accessories', { 'aria-hidden': 'true' });
  moodEl = el('div.pet__mood', { 'aria-hidden': 'true' });

  root.append(body, accessoryEl, moodEl);
  clear(layer).append(root);
  render();
  return root;
}

export function setProfile(next) {
  profile = next;
  render();
}

function render() {
  if (!body) return;
  const def = getPet(profile?.pet?.id);
  paintPet(body, def);
  body.title = profile?.pet?.name || def.defaultName;

  clear(accessoryEl);
  for (const id of profile?.pet?.accessories || []) {
    const acc = getAccessory(id);
    if (acc) accessoryEl.append(el('span', { class: `pet__acc pet__acc--${acc.slot}`, text: acc.emoji }));
  }
}

/** Show the pet (kid screens) or hide it (parent screens). */
export function showPet(visible) {
  if (root) root.classList.toggle('pet--hidden', !visible);
}

/**
 * Move the pet to a corner appropriate for the screen.
 * 'corner' keeps it out of the way during choices; 'stage' centres it for the
 * chant, TPR and celebration, where the pet *is* the activity.
 */
export function setPetPlacement(place) {
  if (root) root.dataset.place = place;
}

/**
 * Drive the pet.
 * @param {'idle'|'ask'|'point'|'cheer'|'encourage'|'dance'|'celebrate'|'sleep'} state
 * @param {{hold?: number, dir?: 'left'|'right'|null}} [opts]
 *   `dir` tips the pet toward a choice for the `point` hint.
 */
export function setState(state, opts = {}) {
  if (!root || !VALID.has(state)) return;
  clearTimeout(holdTimer);
  current = state;
  root.dataset.state = state;
  root.dataset.dir = opts.dir || '';
  root.dataset.reduced = prefersReducedMotion() ? 'true' : '';
  moodEl.textContent = MOOD[state] || '';

  const hold = opts.hold ?? HOLD_MS[state] ?? 0;
  if (hold > 0) holdTimer = setTimeout(() => setState('idle'), hold);
}

export const getState = () => current;

/** Sugar so activities read as intent rather than state names. */
export const petReact = {
  asking:    () => setState('ask'),
  thinking:  () => setState('idle'),
  correct:   () => setState('cheer'),
  wrong:     () => setState('encourage'),
  hint:      (dir) => setState('point', { dir }),
  dancing:   () => setState('dance'),
  celebrate: () => setState('celebrate'),
  sleeping:  () => setState('sleep'),
  idle:      () => setState('idle'),
};

/**
 * A one-off bounce plus optional speech bubble text, used when the pet
 * introduces a new word.
 */
export function petSay(text, ms = 2200) {
  if (!root) return;
  let bubble = root.querySelector('.pet__bubble');
  if (!bubble) {
    bubble = el('div.pet__bubble');
    root.append(bubble);
  }
  bubble.textContent = text;
  bubble.classList.add('is-visible');
  clearTimeout(bubble._timer);
  bubble._timer = setTimeout(() => bubble.classList.remove('is-visible'), ms);
}

/**
 * Hide the speech bubble immediately.
 *
 * The play loop calls this between rounds: a bubble left over from a word
 * introduction would otherwise still be on screen during the next question,
 * printing the answer next to the pet.
 */
export function clearBubble() {
  const bubble = root?.querySelector('.pet__bubble');
  if (!bubble) return;
  clearTimeout(bubble._timer);
  bubble.classList.remove('is-visible');
}

/** Level derived from mastered words — cosmetic, never gates content. */
export function currentPetLevel(masteredCount) {
  return petLevel(masteredCount);
}

/**
 * Paint a pet onto an element: drawn artwork if it has been added, the emoji
 * otherwise.
 *
 * A background image rather than an <img> child, so every CSS animation in
 * pet.css keeps transforming the same single element and none of them need to
 * know which of the two they are moving.
 */
function paintPet(node, def) {
  const id = `pet:${def.id}`;
  if (hasArt(id)) {
    node.textContent = '';
    node.classList.add('pet--art');
    node.style.backgroundImage = `url("${artUrl(id)}")`;
  } else {
    node.classList.remove('pet--art');
    node.style.backgroundImage = '';
    node.textContent = def.emoji;
  }
}

/** A standalone pet sprite for the onboarding picker and trophy screen. */
export function petPreviewEl(petId, { size = '4rem', accessories = [] } = {}) {
  const def = getPet(petId);
  const sprite = el('span.pet-preview__body');
  paintPet(sprite, def);
  const wrap = el('span.pet-preview', { style: { fontSize: size } }, [sprite]);
  for (const id of accessories) {
    const acc = getAccessory(id);
    if (acc) wrap.append(el('span', { class: `pet__acc pet__acc--${acc.slot}`, text: acc.emoji }));
  }
  return wrap;
}
