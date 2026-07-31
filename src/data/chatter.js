// Things the characters say — greetings, politeness, agreement.
//
// These eight phrases used to be unit #1 of the curriculum, taught the same way
// as "cat": hear the word, pick one of two pictures. That was wrong twice over.
//
// It was wrong as pictures. 🙋 hello, 👋 bye and 🙏 please are three variations
// on a yellow hand; ✅ yes and ❌ no are interface symbols, not things. Even the
// drawn artwork makes the point — `please`, `thankyou` and `sorry` are all the
// same boy in three poses. Asked to choose between them a child is solving a
// visual puzzle, not recalling a word.
//
// And it was wrong as teaching. Nobody learns "thank you" from a flashcard.
// They learn it from hearing it every single time something is handed over,
// until the phrase and the moment are the same thing. So that is what happens
// here: the characters say these constantly, at the moment that gives them
// their meaning, and the app never once asks the child to prove it.
//
// Nothing here is scored, scheduled or counted. That is the point — this is the
// part of the language the child absorbs rather than practises. The parent page
// says so out loud, so a missing "hello" row does not read as missing progress.
//
// Each cue may carry `art`, a drawn picture shown beside the line. See
// media/art.js — the id resolves to assets/img/<id>.webp exactly like a word's.

/**
 * @typedef {object} Cue
 * @property {string} id       stable key, matches the old word id
 * @property {string} en       what is said out loud
 * @property {string} lv       Latvian, shown only when lvHints is on
 * @property {string} [art]    optional picture id
 * @property {string} [mood]   only used in this scene mood
 */

/** Cues by moment. The moment is what gives the phrase its meaning. */
export const CHATTER = {
  // Walking into the scene at the start of a visit.
  arrive: [
    { id: 'hello', en: 'Hello!', lv: 'Sveiki!' },
    { id: 'hello', en: 'Hello! Look!', lv: 'Sveiki! Paskaties!' },
  ],

  // Leaving at the end. `goodnight` replaces `bye` in a night scene, which is
  // the only place it means anything.
  leave: [
    { id: 'bye', en: 'Bye bye!', lv: 'Atā!' },
    { id: 'goodnight', en: 'Good night!', lv: 'Ar labu nakti!', mood: 'night' },
  ],

  // Asking for something — the order-fulfilment game already says "Give me the
  // apple", so "please" lands on the end of a real request.
  ask: [
    { id: 'please', en: 'Please!', lv: 'Lūdzu!', art: 'please' },
  ],

  // The moment the child hands something over. This is the one that teaches
  // "thank you", and no flashcard ever will.
  thank: [
    { id: 'thankyou', en: 'Thank you!', lv: 'Paldies!', art: 'thankyou' },
    { id: 'thankyou', en: 'Yes! Thank you!', lv: 'Jā! Paldies!', art: 'thankyou' },
  ],

  // Agreeing with the child. Note there is no matching "wrong" cue: the app
  // never tells a child no, so "no" only appears where it is genuinely useful.
  yes: [
    { id: 'yes', en: 'Yes!', lv: 'Jā!' },
    { id: 'yes', en: 'Yes! That one!', lv: 'Jā! Tieši tas!' },
  ],

  // Contradicting the alien, who is confidently wrong about a picture. This is
  // the honest use of "no" — the child is the one who is right.
  no: [
    { id: 'no', en: 'No! Look again.', lv: 'Nē! Paskaties vēlreiz.' },
  ],

  // The alien, once corrected. An apology for being wrong is exactly what
  // "sorry" is for, and the child gets to be the one owed it.
  sorry: [
    { id: 'sorry', en: 'Sorry! You are right.', lv: 'Piedod! Tev taisnība.', art: 'sorry' },
  ],
};

/** Every id said by a character, for the parent page and for tests. */
export const CHATTER_IDS = [...new Set(
  Object.values(CHATTER).flat().map((cue) => cue.id),
)];

/**
 * Pick something to say at a given moment.
 *
 * @param {keyof CHATTER} moment
 * @param {{mood?: string, rng?: () => number}} [opts]
 * @returns {Cue|null}
 */
export function chatter(moment, { mood = null, rng = Math.random } = {}) {
  const all = CHATTER[moment];
  if (!all?.length) return null;

  // A mood-specific line wins outright where it applies — "Good night!" is the
  // right way to leave a night scene and the wrong way to leave a forest.
  const matching = all.filter((cue) => cue.mood === mood);
  const pool = matching.length ? matching : all.filter((cue) => !cue.mood);
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}
