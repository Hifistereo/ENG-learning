// The pet companion roster.
//
// Each pet is one base emoji plus a mood bubble that changes with the pet's
// state. The bubble is what carries meaning when a child has reduced-motion
// enabled and the body animation is switched off, so every state must be
// distinguishable from the bubble alone.
//
// media/picture.js will prefer assets/img/pets/<id>.webp if such a file is
// ever added, so swapping in drawn characters later needs no code change.

export const PETS = [
  { id: 'cat',     emoji: '🐱', lv: 'Kaķēns',  defaultName: 'Minka' },
  { id: 'dog',     emoji: '🐶', lv: 'Sunītis', defaultName: 'Reksis' },
  { id: 'dragon',  emoji: '🐲', lv: 'Pūķis',   defaultName: 'Dzirkstis' },
  { id: 'bunny',   emoji: '🐰', lv: 'Zaķis',   defaultName: 'Ausainis' },
  { id: 'owl',     emoji: '🦉', lv: 'Pūce',    defaultName: 'Gudrīte' },
  { id: 'monkey',  emoji: '🐵', lv: 'Pērtiķis', defaultName: 'Bimbo' },
  { id: 'unicorn', emoji: '🦄', lv: 'Vienradzis', defaultName: 'Varavīksne' },
  { id: 'penguin', emoji: '🐧', lv: 'Pingvīns', defaultName: 'Ledus' },
];

/** Mood bubble shown next to the pet for each state. */
export const MOOD = {
  idle:      '',
  ask:       '❓',
  point:     '👀',
  cheer:     '⭐',
  encourage: '💪',
  dance:     '🎵',
  celebrate: '🎉',
  sleep:     '💤',
};

// Accessories are unlocked by achievement cards (see data/achievements.js).
// The pet wears every accessory the child has earned, stacked around it.
export const ACCESSORIES = [
  { id: 'cap',     emoji: '🧢', lv: 'Cepurīte',    slot: 'head' },
  { id: 'crown',   emoji: '👑', lv: 'Kronis',      slot: 'head' },
  { id: 'bow',     emoji: '🎀', lv: 'Bantīte',     slot: 'head' },
  { id: 'scarf',   emoji: '🧣', lv: 'Šalle',       slot: 'neck' },
  { id: 'medal',   emoji: '🏅', lv: 'Medaļa',      slot: 'neck' },
  { id: 'glasses', emoji: '🕶️', lv: 'Brilles',     slot: 'face' },
  { id: 'wand',    emoji: '🪄', lv: 'Burvju zizlis', slot: 'hand' },
  { id: 'sparkle', emoji: '✨', lv: 'Dzirksteles', slot: 'aura' },
];

// The pet grows as the child masters words. Level is cosmetic — it never
// gates content, it just gives long-term progress something visible.
export const PET_LEVELS = [
  { level: 1, minMastered: 0,   lv: 'Mazulis' },
  { level: 2, minMastered: 10,  lv: 'Draugs' },
  { level: 3, minMastered: 25,  lv: 'Palīgs' },
  { level: 4, minMastered: 50,  lv: 'Varonis' },
  { level: 5, minMastered: 80,  lv: 'Meistars' },
  { level: 6, minMastered: 120, lv: 'Leģenda' },
];

const petsById = new Map(PETS.map((p) => [p.id, p]));
const accById = new Map(ACCESSORIES.map((a) => [a.id, a]));

export const getPet = (id) => petsById.get(id) || PETS[0];
export const getAccessory = (id) => accById.get(id) || null;

export function petLevel(masteredCount) {
  let current = PET_LEVELS[0];
  for (const lvl of PET_LEVELS) if (masteredCount >= lvl.minMastered) current = lvl;
  return current;
}

/** Mastered words still needed for the next level, or null at max level. */
export function nextPetLevel(masteredCount) {
  return PET_LEVELS.find((l) => l.minMastered > masteredCount) || null;
}
