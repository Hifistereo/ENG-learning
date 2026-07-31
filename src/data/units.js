// Thematic units in teaching order.
//
// Order matters more than it looks. The first unit is the child's entire first
// impression of the app, and it decides whether the opening minutes feel like a
// game or a test.
//
// The rule now is picturability: how well a word can be drawn, pointed at and
// recognised without explanation. Animals lead because they are concrete,
// lovable, already illustrated, and every child already has the concepts in
// Latvian — the only new thing is the English label. Things you can hold come
// next, then places and nature. Properties (colours), inner states (feelings)
// and abstractions (numbers) come last, because a picture of "three" is a
// convention the child has to be taught before it can teach anything.
//
// Greetings used to be unit #1. It was the one unit where pictures cannot work
// at all — you cannot draw "please" — so a child's first minute in the app was
// arbitrary symbol-matching. Those phrases are now said by the characters
// instead of quizzed; see data/chatter.js.
//
// `unlockAt` is the fraction of the previous unit that must be mastered
// before this one opens. Parents can override any lock from the parent page.

export const UNITS = [
  { id: 'animals',   lv: 'Dzīvnieki',       emoji: '🐶', color: '#2a9d5c' },
  { id: 'food',      lv: 'Ēdiens',          emoji: '🍎', color: '#d1495b' },
  { id: 'home',      lv: 'Mājas',           emoji: '🏠', color: '#2a9d5c' },
  { id: 'nature',    lv: 'Daba',            emoji: '🌳', color: '#2a9d5c' },
  { id: 'toys',      lv: 'Rotaļlietas',     emoji: '🧸', color: '#d1495b' },
  { id: 'clothes',   lv: 'Apģērbs',         emoji: '👕', color: '#7048a8' },
  { id: 'vehicles',  lv: 'Transports',      emoji: '🚗', color: '#fb8500' },
  { id: 'body',      lv: 'Ķermenis',        emoji: '👀', color: '#fb8500' },
  { id: 'family',    lv: 'Ģimene',          emoji: '👨‍👩‍👧', color: '#219ebc' },
  { id: 'actions',   lv: 'Darbības',        emoji: '🏃', color: '#219ebc' },
  { id: 'colors',    lv: 'Krāsas',          emoji: '🎨', color: '#7048a8' },
  { id: 'feelings',  lv: 'Sajūtas',         emoji: '😄', color: '#d1495b' },
  { id: 'numbers',   lv: 'Skaitļi',         emoji: '🔢', color: '#126782' },
];

/** Fraction of a unit that must be mastered before the next one unlocks. */
export const UNLOCK_THRESHOLD = 0.7;

/**
 * Units whose words name a thing you could physically hand to someone.
 *
 * The order-fulfilment game builds real sentences from these: "Give me the
 * apple." Everything else would produce English no speaker would ever say —
 * "Give me red", "Give me jump", "Give me the rain" — and teaching a child a
 * sentence that does not exist is worse than teaching them nothing.
 */
export const ORDERABLE_UNITS = new Set(['food', 'toys', 'clothes', 'home', 'vehicles', 'animals']);

/** @param {object} word */
export const canOrder = (word) => ORDERABLE_UNITS.has(word?.unit);

/**
 * Where a session about this unit takes place.
 *
 * A visit happens in one illustrated scene, and the scene should be somewhere
 * the unit's words would actually be. Clothes belong in weather you need them
 * for; vehicles belong on a road. Keys are moods from data/stories.js, so the
 * scene artwork and the fallback gradients are shared with the stories.
 *
 * Several candidates per unit on purpose: a child who plays every day should
 * not open the same picture every day.
 */
export const UNIT_SCENES = {
  animals:  ['forest', 'water', 'home'],
  food:     ['home'],
  home:     ['home', 'night'],
  nature:   ['forest', 'water', 'snow'],
  toys:     ['home'],
  clothes:  ['snow', 'rain'],
  vehicles: ['road'],
  body:     ['home', 'forest'],
  family:   ['home'],
  actions:  ['forest', 'road', 'water'],
  colors:   ['forest', 'home'],
  feelings: ['home', 'rain'],
  numbers:  ['home', 'forest'],
};

/** The default when a unit has no mapping — every scene set includes it. */
export const DEFAULT_SCENE = 'home';

/**
 * Pick the place a session happens in.
 * @param {string} unitId
 * @param {{avoid?: string, rng?: () => number}} [opts] - `avoid` is the last
 *   scene this child visited, so two sessions in a row look different.
 */
export function sceneForUnit(unitId, { avoid = null, rng = Math.random } = {}) {
  const options = UNIT_SCENES[unitId] || [DEFAULT_SCENE];
  const fresh = options.filter((m) => m !== avoid);
  const pool = fresh.length ? fresh : options;
  return pool[Math.floor(rng() * pool.length)];
}

export const UNIT_IDS = UNITS.map((u) => u.id);

const byId = new Map(UNITS.map((u) => [u.id, u]));

export const getUnit = (id) => byId.get(id) || null;

export const unitIndex = (id) => UNIT_IDS.indexOf(id);
