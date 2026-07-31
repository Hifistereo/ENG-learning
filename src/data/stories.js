// Story adventures.
//
// Each story is a short arc — a character has a problem, and understanding the
// English is what solves it. Getting it right changes what happens next; it
// does not award a point. That is the whole difference between this and a
// quiz with a picture behind it.
//
// Scenes specify a *unit* rather than a fixed word, so the slot is filled from
// whatever the child is actually working on. The same story therefore drills
// this week's vocabulary rather than a fixed script the child memorises.
//
// Where the sentence constrains the answer, the scene also lists `slotWords`.
// "The cat is thirsty. Find the ___." must not be filled with "bread" just
// because bread is in the food unit — a story that contradicts itself teaches
// the child that the words do not really mean anything. `slotWords` is a hard
// constraint; `slotUnit` alone is only used where any word in the unit is a
// sensible answer.
//
// The `___` slot takes the bare word: templates carry their own determiner, so
// "Find the ___" plus "cat" reads "Find the cat", not "Find the a cat".
//
// Design rule, from the research notes: nothing on a scene is clickable except
// the things that answer the question. If a child can poke around for
// animations, they learn to hunt for effects instead of listening.
//
// ── Images ──────────────────────────────────────────────────────────────────
// Every story and scene declares an image slot. Until real artwork exists the
// app draws an emoji-and-gradient scene automatically; drop a file in and it
// is used instead, with no code change. See assets/BRIEF.md for the full list
// of filenames and what each one should show.

export const STORIES = [
  {
    id: 'hungry_cat',
    lv: 'Izsalkušais kaķis',
    hero: { id: 'cat', emoji: '🐱', lv: 'kaķis' },
    mood: 'home',
    intro: 'This is my cat. My cat is hungry.',
    introLv: 'Šis ir mans kaķis. Kaķis ir izsalcis.',
    outro: 'The cat is happy. Thank you!',
    outroLv: 'Kaķis ir priecīgs. Paldies!',
    scenes: [
      { mood: 'home',  ask: 'The cat is hungry. Find the ___.', lv: 'Kaķis ir izsalcis.', slotUnit: 'food',
        win: 'Yum! The cat is eating.' },
      { mood: 'home',  ask: 'The cat is thirsty. Find the ___.', lv: 'Kaķis grib dzert.',  slotUnit: 'food',
        slotWords: ['milk', 'water', 'juice'], win: 'The cat is drinking.' },
      { mood: 'night', ask: 'The cat is tired. Find the ___.',   lv: 'Kaķis ir noguris.',  slotUnit: 'home',
        slotWords: ['bed'], win: 'Good night, cat!' },
    ],
  },
  {
    id: 'dog_journey',
    lv: 'Suņa ceļojums',
    hero: { id: 'dog', emoji: '🐶', lv: 'suns' },
    mood: 'road',
    intro: 'My dog wants to go far away.',
    introLv: 'Mans suns grib doties tālu prom.',
    outro: 'We are here! What a good trip.',
    outroLv: 'Mēs esam klāt! Lielisks ceļojums.',
    scenes: [
      { mood: 'road',   ask: 'We need to go. Find the ___.',   lv: 'Mums jādodas ceļā.', slotUnit: 'vehicles',
        win: 'Off we go!' },
      { mood: 'rain',   ask: 'It is raining. Find the ___.',   lv: 'Līst lietus.',       slotUnit: 'clothes',
        slotWords: ['jacket', 'hat'], win: 'Now the dog is dry.' },
      { mood: 'forest', ask: 'Look outside! Find the ___.',    lv: 'Paskaties ārā!',     slotUnit: 'nature',
        win: 'How beautiful!' },
    ],
  },
  {
    id: 'bear_winter',
    lv: 'Lācis ziemā',
    hero: { id: 'bear', emoji: '🐻', lv: 'lācis' },
    mood: 'snow',
    intro: 'It is cold. My bear is cold too.',
    introLv: 'Ir auksti. Manam lācim arī ir auksti.',
    outro: 'The bear is warm and happy!',
    outroLv: 'Lācis ir silts un priecīgs!',
    scenes: [
      { mood: 'snow',  ask: 'The bear is cold. Find the ___.',   lv: 'Lācim ir auksti.',   slotUnit: 'clothes',
        slotWords: ['jacket', 'scarf', 'hat', 'gloves', 'socks'], win: 'Much warmer!' },
      { mood: 'home',  ask: 'The bear is hungry. Find the ___.', lv: 'Lācis ir izsalcis.', slotUnit: 'food',
        win: 'The bear is eating.' },
      { mood: 'night', ask: 'Time to sleep. Find the ___.',      lv: 'Laiks gulēt.',       slotUnit: 'home',
        slotWords: ['bed'], win: 'Sleep well, bear!' },
    ],
  },
  {
    id: 'lost_duck',
    lv: 'Pazudusī pīle',
    hero: { id: 'duck', emoji: '🦆', lv: 'pīle' },
    mood: 'water',
    intro: 'My little duck is lost. Help me find the way.',
    introLv: 'Mana pīlīte ir apmaldījusies. Palīdzi atrast ceļu.',
    outro: 'The duck found her family!',
    outroLv: 'Pīle atrada savu ģimeni!',
    scenes: [
      { mood: 'water',  ask: 'Who is in the water? Find the ___.', lv: 'Kas ir ūdenī?',     slotUnit: 'animals',
        slotWords: ['fish', 'duck'], win: 'Hello, friend!' },
      { mood: 'forest', ask: 'Look up! Find the ___.',             lv: 'Paskaties augšup!', slotUnit: 'nature',
        slotWords: ['sun', 'moon', 'star', 'cloud'], win: 'There it is!' },
      { mood: 'home',   ask: 'We are home. Find ___.',             lv: 'Mēs esam mājās.',   slotUnit: 'family',
        win: 'Everyone is here!' },
    ],
  },
];

/**
 * Background treatments. Used to draw a scene when no artwork is present, and
 * kept as the CSS class name when it is, so a photo and a gradient sit in the
 * same layout.
 */
export const MOODS = {
  home:   { emoji: '🏠', sky: ['#fff3d6', '#ffe0a3'] },
  night:  { emoji: '🌙', sky: ['#2b3a67', '#4a5a8a'] },
  road:   { emoji: '🛣️', sky: ['#dff0f7', '#a8d8ea'] },
  rain:   { emoji: '🌧️', sky: ['#c9d6df', '#8fa6b5'] },
  forest: { emoji: '🌳', sky: ['#d8f0d3', '#9dd39a'] },
  snow:   { emoji: '❄️', sky: ['#eaf4ff', '#c3dcf5'] },
  water:  { emoji: '🌊', sky: ['#d4f1f9', '#88ccdd'] },
};

const byId = new Map(STORIES.map((s) => [s.id, s]));

export const getStory = (id) => byId.get(id) || null;

/**
 * Pick the story that best fits the units this session is working on, so the
 * adventure practises the words the child is already meeting elsewhere.
 *
 * @param {string[]} units - units the session's words come from
 * @param {string[]} [recentIds] - stories played recently, to avoid repeats
 */
export function pickStory(units, recentIds = [], rng = Math.random) {
  const wanted = new Set(units);
  const scored = STORIES.map((story) => ({
    story,
    // How many of this story's slots the session can actually fill.
    fit: story.scenes.filter((scene) => wanted.has(scene.slotUnit)).length,
    stale: recentIds.includes(story.id) ? 1 : 0,
  }));

  const best = Math.max(...scored.map((s) => s.fit));
  const pool = scored.filter((s) => s.fit === best);
  const fresh = pool.filter((s) => !s.stale);
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(rng() * from.length)].story;
}
