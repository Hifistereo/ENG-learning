// Thematic units in teaching order.
//
// Order matters: we start with words a child already has concepts for in
// Latvian (greetings, animals, food) so the only new thing is the English
// label. Abstract sets (feelings, actions) come later.
//
// `unlockAt` is the fraction of the previous unit that must be mastered
// before this one opens. Parents can override any lock from the parent page.

export const UNITS = [
  { id: 'greetings', lv: 'Sasveicināšanās', emoji: '👋', color: '#ffb703' },
  { id: 'animals',   lv: 'Dzīvnieki',       emoji: '🐶', color: '#2a9d5c' },
  { id: 'food',      lv: 'Ēdiens',          emoji: '🍎', color: '#d1495b' },
  { id: 'colors',    lv: 'Krāsas',          emoji: '🎨', color: '#7048a8' },
  { id: 'body',      lv: 'Ķermenis',        emoji: '👀', color: '#fb8500' },
  { id: 'family',    lv: 'Ģimene',          emoji: '👨‍👩‍👧', color: '#219ebc' },
  { id: 'numbers',   lv: 'Skaitļi',         emoji: '🔢', color: '#126782' },
  { id: 'toys',      lv: 'Rotaļlietas',     emoji: '🧸', color: '#d1495b' },
  { id: 'clothes',   lv: 'Apģērbs',         emoji: '👕', color: '#7048a8' },
  { id: 'home',      lv: 'Mājas',           emoji: '🏠', color: '#2a9d5c' },
  { id: 'vehicles',  lv: 'Transports',      emoji: '🚗', color: '#fb8500' },
  { id: 'nature',    lv: 'Daba',            emoji: '🌳', color: '#2a9d5c' },
  { id: 'actions',   lv: 'Darbības',        emoji: '🏃', color: '#219ebc' },
  { id: 'feelings',  lv: 'Sajūtas',         emoji: '😄', color: '#d1495b' },
];

/** Fraction of a unit that must be mastered before the next one unlocks. */
export const UNLOCK_THRESHOLD = 0.7;

export const UNIT_IDS = UNITS.map((u) => u.id);

const byId = new Map(UNITS.map((u) => [u.id, u]));

export const getUnit = (id) => byId.get(id) || null;

export const unitIndex = (id) => UNIT_IDS.indexOf(id);
