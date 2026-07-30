// Achievement cards.
//
// ─── How to add a card ──────────────────────────────────────────────────────
// Append an entry to CARDS. That is the whole job — no engine changes, no
// migration. Because conditions are evaluated statelessly against the full
// history (see core/achievements.js), a card added in a later version unlocks
// immediately for children who already met its condition months ago.
//
//   id      stable, unique, never reused — it is the storage key
//   tier    bronze | silver | gold | rainbow, styles the card
//   emoji   the card art
//   title   Latvian, shown on the card
//   hint    Latvian, shown while still locked — a visible goal is what makes
//           an achievement motivating rather than a surprise
//   reward  optional { type:'petAccessory', id } — ties into the pet
//   test    (snapshot) => boolean, see core/stats.js snapshot() for fields
//
// Design rule for conditions: they must be monotonic — once true for a given
// history, always true. Never write a card that can un-earn itself.
// ────────────────────────────────────────────────────────────────────────────

export const CARDS = [
  // --- First steps -------------------------------------------------------
  {
    id: 'first_session', tier: 'bronze', emoji: '🌱',
    title: 'Pirmais solis', hint: 'Nospēlē pirmo spēli',
    test: (s) => s.sessions >= 1,
  },
  {
    id: 'first_word', tier: 'bronze', emoji: '🔤',
    title: 'Pirmais vārds', hint: 'Apgūsti savu pirmo vārdu',
    test: (s) => s.wordsMastered >= 1,
  },

  // --- Streaks -----------------------------------------------------------
  {
    id: 'streak_3', tier: 'bronze', emoji: '🔥',
    title: 'Trīs dienas', hint: 'Spēlē trīs dienas pēc kārtas',
    test: (s) => s.streakDays >= 3 || s.bestStreakDays >= 3,
  },
  {
    id: 'streak_7', tier: 'silver', emoji: '🔥',
    title: 'Vesela nedēļa', hint: 'Spēlē septiņas dienas pēc kārtas',
    reward: { type: 'petAccessory', id: 'cap' },
    test: (s) => s.streakDays >= 7 || s.bestStreakDays >= 7,
  },
  {
    id: 'streak_14', tier: 'gold', emoji: '🔥',
    title: 'Divas nedēļas', hint: 'Spēlē četrpadsmit dienas pēc kārtas',
    reward: { type: 'petAccessory', id: 'scarf' },
    test: (s) => s.streakDays >= 14 || s.bestStreakDays >= 14,
  },
  {
    id: 'streak_30', tier: 'rainbow', emoji: '🏆',
    title: 'Vesels mēnesis!', hint: 'Spēlē trīsdesmit dienas pēc kārtas',
    reward: { type: 'petAccessory', id: 'crown' },
    test: (s) => s.streakDays >= 30 || s.bestStreakDays >= 30,
  },

  // --- Words mastered ----------------------------------------------------
  {
    id: 'words_10', tier: 'bronze', emoji: '⭐',
    title: 'Desmit vārdi', hint: 'Apgūsti 10 vārdus',
    test: (s) => s.wordsMastered >= 10,
  },
  {
    id: 'words_25', tier: 'silver', emoji: '🌟',
    title: 'Divdesmit pieci', hint: 'Apgūsti 25 vārdus',
    reward: { type: 'petAccessory', id: 'bow' },
    test: (s) => s.wordsMastered >= 25,
  },
  {
    id: 'words_50', tier: 'gold', emoji: '💫',
    title: 'Piecdesmit vārdi', hint: 'Apgūsti 50 vārdus',
    reward: { type: 'petAccessory', id: 'medal' },
    test: (s) => s.wordsMastered >= 50,
  },
  {
    id: 'words_100', tier: 'rainbow', emoji: '👑',
    title: 'Simts vārdu!', hint: 'Apgūsti 100 vārdus',
    reward: { type: 'petAccessory', id: 'sparkle' },
    test: (s) => s.wordsMastered >= 100,
  },

  // --- Unit completion ---------------------------------------------------
  { id: 'unit_greetings', tier: 'silver', emoji: '👋', title: 'Sasveicināšanās meistars', hint: 'Apgūsti visu tēmu “Sasveicināšanās”', test: (s) => !!s.units.greetings?.done },
  { id: 'unit_animals',   tier: 'silver', emoji: '🐶', title: 'Dzīvnieku draugs',        hint: 'Apgūsti visu tēmu “Dzīvnieki”',        test: (s) => !!s.units.animals?.done },
  { id: 'unit_food',      tier: 'silver', emoji: '🍎', title: 'Garšu pazinējs',          hint: 'Apgūsti visu tēmu “Ēdiens”',           test: (s) => !!s.units.food?.done },
  { id: 'unit_colors',    tier: 'silver', emoji: '🎨', title: 'Krāsu mākslinieks',       hint: 'Apgūsti visu tēmu “Krāsas”',           test: (s) => !!s.units.colors?.done },
  { id: 'unit_body',      tier: 'silver', emoji: '👀', title: 'No galvas līdz kājām',    hint: 'Apgūsti visu tēmu “Ķermenis”',         test: (s) => !!s.units.body?.done },
  { id: 'unit_family',    tier: 'silver', emoji: '👨‍👩‍👧', title: 'Ģimenes sirds',      hint: 'Apgūsti visu tēmu “Ģimene”',           test: (s) => !!s.units.family?.done },
  { id: 'unit_numbers',   tier: 'silver', emoji: '🔢', title: 'Skaitļu meistars',        hint: 'Apgūsti visu tēmu “Skaitļi”',          test: (s) => !!s.units.numbers?.done },
  {
    id: 'units_5', tier: 'gold', emoji: '🗺️',
    title: 'Piecas tēmas', hint: 'Pabeidz piecas tēmas',
    reward: { type: 'petAccessory', id: 'glasses' },
    test: (s) => s.unitsComplete >= 5,
  },

  // --- Effort ------------------------------------------------------------
  {
    id: 'sessions_10', tier: 'bronze', emoji: '🎯',
    title: 'Desmit spēles', hint: 'Nospēlē 10 spēles',
    test: (s) => s.sessions >= 10,
  },
  {
    id: 'sessions_25', tier: 'silver', emoji: '🚀',
    title: 'Divdesmit piecas spēles', hint: 'Nospēlē 25 spēles',
    test: (s) => s.sessions >= 25,
  },
  {
    id: 'sessions_50', tier: 'gold', emoji: '🎖️',
    title: 'Piecdesmit spēles', hint: 'Nospēlē 50 spēles',
    reward: { type: 'petAccessory', id: 'wand' },
    test: (s) => s.sessions >= 50,
  },
  {
    id: 'perfect_round', tier: 'silver', emoji: '💯',
    title: 'Bez kļūdām', hint: 'Nospēlē spēli bez nevienas kļūdas',
    test: (s) => s.perfectSessions >= 1,
  },
  {
    id: 'busy_week', tier: 'silver', emoji: '📅',
    title: 'Čakla nedēļa', hint: 'Nospēlē piecas spēles vienā nedēļā',
    test: (s) => s.weekSessions >= 5,
  },

  // --- Trying new things -------------------------------------------------
  {
    id: 'first_sentence', tier: 'silver', emoji: '💬',
    title: 'Pirmais teikums', hint: 'Pabeidz savu pirmo teikumu',
    test: (s) => s.activitiesUsed.includes('sentence'),
  },
  {
    id: 'first_phonics', tier: 'bronze', emoji: '🅰️',
    title: 'Burtu draugs', hint: 'Uzmini vārdu pēc pirmā burta',
    test: (s) => s.activitiesUsed.includes('phonics'),
  },
  {
    id: 'first_memory', tier: 'bronze', emoji: '🃏',
    title: 'Laba atmiņa', hint: 'Atrodi visus pārīšus',
    test: (s) => s.activitiesUsed.includes('memory'),
  },
  {
    id: 'explorer', tier: 'gold', emoji: '🧭',
    title: 'Pētnieks', hint: 'Izmēģini visu veidu uzdevumus',
    test: (s) => ['listenTap', 'phonics', 'memory', 'sentence'].every((a) => s.activitiesUsed.includes(a)),
  },
];

const byId = new Map(CARDS.map((c) => [c.id, c]));

export const getCard = (id) => byId.get(id) || null;

export const TOTAL_CARDS = CARDS.length;

/** Cards grouped for display, keeping catalogue order within each tier. */
export const TIER_ORDER = ['bronze', 'silver', 'gold', 'rainbow'];
