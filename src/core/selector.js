// Choosing what to show next.
//
// Three jobs, all pure so they can be tested without a browser:
//   1. work out which units and words are open to this child
//   2. mix due reviews with a capped number of new words into a session queue
//   3. pick distractors that make a question meaningfully hard, not randomly hard
//
// The new-word cap is the important number here. Toddlers can absorb roughly
// three new labels in a sitting and five-year-olds about five; going past that
// doesn't teach more, it just pushes the review queue into a backlog the child
// then fails.

import { WORDS, getWord, wordsInUnit } from '../data/words.js';
import { UNIT_IDS, UNLOCK_THRESHOLD } from '../data/units.js';
import { isDue, overdueDays } from './srs.js';
import { isKnown, readyForTransfer, readyForProduction } from './knowledge.js';

/** Ceiling on new words per session, by age band. */
export const NEW_WORD_CAP = { 2: 3, 5: 5 };

/** Slots one new word consumes: an introduction plus two spaced practices. */
export const NEW_WORD_SLOTS = 3;

/**
 * Share of a session that new words may occupy. The rest is review.
 *
 * Without this ceiling a short session spends every slot on new vocabulary and
 * never revisits anything, which is precisely the failure mode spaced
 * repetition exists to prevent — the child meets five words today and has
 * forgotten four by tomorrow.
 */
const NEW_WORD_SHARE = 0.5;

/** How many new words a session of this size can afford. Always at least 1. */
export function newWordAllowance(ageBand, size) {
  const byAge = NEW_WORD_CAP[ageBand] ?? NEW_WORD_CAP[5];
  const bySize = Math.floor((size * NEW_WORD_SHARE) / NEW_WORD_SLOTS);
  return Math.max(1, Math.min(byAge, bySize));
}

/** How many answer choices a question offers, by age band. */
export const CHOICE_COUNT = { 2: 2, 5: 4 };

const shuffle = (arr, rng = Math.random) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// --- Units ---------------------------------------------------------------

/**
 * Units this child may draw from.
 * The first unit is always open. Each later unit opens once UNLOCK_THRESHOLD
 * of the previous one is mastered, and parents can force any unit open from
 * the parent page (progress.unlockedUnits).
 */
export function unlockedUnits(profile, progress) {
  const forced = new Set(progress.unlockedUnits || []);
  const open = [UNIT_IDS[0]];

  for (let i = 1; i < UNIT_IDS.length; i += 1) {
    const previous = UNIT_IDS[i - 1];
    if (forced.has(UNIT_IDS[i]) || unitMastery(previous, profile, progress) >= UNLOCK_THRESHOLD) {
      open.push(UNIT_IDS[i]);
    } else if (!forced.has(UNIT_IDS[i])) {
      // Stop at the first locked unit unless a parent opened a later one.
      for (let j = i; j < UNIT_IDS.length; j += 1) if (forced.has(UNIT_IDS[j])) open.push(UNIT_IDS[j]);
      break;
    }
  }
  return [...new Set(open)];
}

/**
 * Fraction of a unit's age-appropriate words the child actually knows, 0..1.
 *
 * Measured against the evidence bar (transfer + delayed recall), not tap
 * counts — so a unit does not unlock the next one on the strength of a good
 * afternoon.
 */
export function unitMastery(unitId, profile, progress) {
  const words = wordsInUnit(unitId).filter((w) => w.level <= profile.ageBand);
  if (!words.length) return 1;
  const done = words.filter((w) => isKnown(progress.words[w.id], profile.ageBand)).length;
  return done / words.length;
}

/** Every word open to this child right now. */
export function availableWords(profile, progress) {
  const open = new Set(unlockedUnits(profile, progress));
  return WORDS.filter((w) => w.level <= profile.ageBand && open.has(w.unit));
}

/** The unit new words are currently being drawn from. */
export function currentUnit(profile, progress) {
  const open = unlockedUnits(profile, progress);
  const unstarted = open.find((id) =>
    wordsInUnit(id).some((w) => w.level <= profile.ageBand && !progress.words[w.id]));
  return unstarted || open[open.length - 1];
}

// --- Word pools ----------------------------------------------------------

/** Words that are due for review, most overdue first. */
export function dueWords(profile, progress, now = Date.now()) {
  return availableWords(profile, progress)
    .filter((w) => isDue(progress.words[w.id], now))
    .sort((a, b) => overdueDays(progress.words[b.id], now) - overdueDays(progress.words[a.id], now));
}

/**
 * Words the child has never met, from the earliest unit with anything left.
 * For toddlers we prefer one-syllable words: they are easier to hear as a
 * distinct unit and easier to eventually say.
 */
export function newCandidates(profile, progress) {
  const unit = currentUnit(profile, progress);
  const fromUnit = wordsInUnit(unit)
    .filter((w) => w.level <= profile.ageBand && !progress.words[w.id]);

  const pool = fromUnit.length
    ? fromUnit
    : availableWords(profile, progress).filter((w) => !progress.words[w.id]);

  if (profile.ageBand === 2) return [...pool].sort((a, b) => a.syl - b.syl);
  return pool;
}

/**
 * Seen-but-not-due words, least recently practised first. Used as filler so a
 * session is never short just because nothing is technically due yet.
 */
function fillerWords(profile, progress, exclude) {
  return availableWords(profile, progress)
    .filter((w) => progress.words[w.id] && !exclude.has(w.id))
    .sort((a, b) => {
      const A = progress.words[a.id];
      const B = progress.words[b.id];
      // Not-yet-known words first, then whatever was practised longest ago.
      const kA = isKnown(A, profile.ageBand) ? 1 : 0;
      const kB = isKnown(B, profile.ageBand) ? 1 : 0;
      if (kA !== kB) return kA - kB;
      return A.lastSeen - B.lastSeen;
    });
}

/**
 * Words due for a transfer check: recognised reliably, but never yet seen
 * from their alternate picture. Only words that have one, obviously.
 */
export function transferCandidates(profile, progress) {
  return availableWords(profile, progress)
    .filter((w) => w.alt && readyForTransfer(progress.words[w.id]));
}

/**
 * Words ready to be said out loud: understood, including from a second
 * picture. Age 5 and up — production is not asked of toddlers.
 */
export function productionCandidates(profile, progress) {
  if (profile.ageBand === 2) return [];
  return availableWords(profile, progress)
    .filter((w) => readyForProduction(progress.words[w.id]));
}

// --- Session queue -------------------------------------------------------

/**
 * Build the word queue for one session.
 *
 * New words appear three times (introduce, then two spaced practices) because
 * a single exposure teaches nothing; review words appear once.
 *
 * @param {object} profile
 * @param {object} progress
 * @param {{now?: number, size?: number, rng?: Function}} [opts]
 * @returns {{queue: Array<{word: object, isNew: boolean}>, newWords: object[], reviewWords: object[]}}
 */
export function buildSession(profile, progress, opts = {}) {
  const { now = Date.now(), size = 12, rng = Math.random } = opts;
  const cap = newWordAllowance(profile.ageBand, size);

  const newWords = newCandidates(profile, progress).slice(0, cap);
  const newIds = new Set(newWords.map((w) => w.id));

  // Each new word costs three slots; the rest of the session is review.
  const reviewBudget = Math.max(0, size - newWords.length * NEW_WORD_SLOTS);

  const due = dueWords(profile, progress, now).filter((w) => !newIds.has(w.id));
  const reviewWords = due.slice(0, reviewBudget);

  if (reviewWords.length < reviewBudget) {
    const taken = new Set([...newIds, ...reviewWords.map((w) => w.id)]);
    reviewWords.push(...fillerWords(profile, progress, taken).slice(0, reviewBudget - reviewWords.length));
  }

  const queue = interleave(newWords, reviewWords, rng);
  return { queue, newWords, reviewWords };
}

/**
 * Weave new words through the review words so that:
 *   - a new word is introduced, then practised twice with gaps between
 *   - a word is never practised before it has been introduced
 *   - the same word does not appear twice in a row where that is avoidable
 */
function interleave(newWords, reviewWords, rng) {
  const slots = [];
  for (const word of shuffle(reviewWords, rng)) slots.push({ word, isNew: false });

  for (const [i, word] of newWords.entries()) {
    // Spread introductions across the session rather than front-loading them.
    const anchor = Math.floor((slots.length + 1) * ((i + 0.5) / (newWords.length + 0.5)));
    slots.splice(Math.min(anchor, slots.length), 0, { word, isNew: true, intro: true });
    // Two practice repeats, a few items downstream of the introduction.
    const at = slots.findIndex((s) => s.word.id === word.id && s.intro);
    slots.splice(Math.min(at + 3, slots.length), 0, { word, isNew: true });
    slots.splice(Math.min(at + 7, slots.length), 0, { word, isNew: true });
  }

  spaceOutRepeats(slots);
  return slots;
}

/**
 * Best-effort pass to break up back-to-back repeats of the same word.
 *
 * The hard constraint is that an introduction must stay ahead of the practices
 * that depend on it — being quizzed on a word the pet has not taught yet is
 * the one failure a child cannot recover from. So intro slots never move, and
 * a slot may only shift earlier if its own introduction is already behind it.
 *
 * Some runs are unavoidable (a first-ever session may hold nothing but one new
 * word), which is why this is best-effort rather than guaranteed.
 */
function spaceOutRepeats(slots) {
  const introAt = new Map();
  slots.forEach((slot, i) => {
    if (slot.intro) introAt.set(slot.word.id, i);
  });
  // Swapping preserves length and leaves intro slots in place, so these
  // indices stay valid for the whole pass.
  const introducedBefore = (slot, position) => {
    const at = introAt.get(slot.word.id);
    return at === undefined || at < position;
  };

  for (let i = 1; i < slots.length; i += 1) {
    if (slots[i].word.id !== slots[i - 1].word.id) continue;
    if (slots[i].intro) continue;

    for (let j = i + 1; j < slots.length; j += 1) {
      const candidate = slots[j];
      if (candidate.intro) continue;
      if (candidate.word.id === slots[i - 1].word.id) continue;      // same run, no help
      if (slots[j - 1]?.word.id === slots[i].word.id) continue;      // would create a new run
      if (slots[j + 1]?.word.id === slots[i].word.id) continue;
      if (!introducedBefore(candidate, i)) continue;                 // must not jump its own intro
      [slots[i], slots[j]] = [slots[j], slots[i]];
      break;
    }
  }
}

// --- Distractors ---------------------------------------------------------

/**
 * Choose the wrong answers for a question.
 *
 * Same-unit distractors are the goal: "which of these four animals is the
 * cat?" is a real vocabulary question, while "is the cat the one that isn't a
 * sock?" can be answered without knowing any English.
 *
 * For toddlers we additionally avoid two kinds of near-miss:
 *   - words starting with the same sound (cat/cow) — a phonological
 *     discrimination task stacked on top of a vocabulary one
 *   - words whose pictures look alike (hello 🙋 / bye 👋 / hand ✋), tagged
 *     with a shared `look` group in data/words.js
 * Either one turns the question into a puzzle about the picture rather than a
 * question about the English word, and two hard things at once is where a
 * 2-year-old gives up.
 *
 * @param {object} target
 * @param {object[]} pool - words available to this child
 * @param {number} count
 * @param {{ageBand?: number, rng?: Function, progress?: object}} [opts]
 */
export function pickDistractors(target, pool, count, opts = {}) {
  const { ageBand = 5, rng = Math.random, progress = null } = opts;
  if (count <= 0) return [];

  const others = pool.filter((w) => w.id !== target.id && w.emoji !== target.emoji);
  const sameUnit = others.filter((w) => w.unit === target.unit);
  const sameSound = (w) => w.en[0].toLowerCase() === target.en[0].toLowerCase();
  const sameLook = (w) => !!target.look && w.look === target.look;
  const easy = (w) => !sameSound(w) && !sameLook(w);

  // Preference tiers, best first. Each is relaxed only if the one above it
  // cannot fill the slots — a look-alike is still better than an empty slot.
  const tiers = ageBand === 2
    ? [
        sameUnit.filter((w) => easy(w) && progress?.words?.[w.id]),
        sameUnit.filter(easy),
        others.filter(easy),
        others.filter((w) => !sameLook(w)),
        others,
      ]
    : [
        sameUnit,
        others,
      ];

  const chosen = [];
  const used = new Set([target.id]);
  for (const tier of tiers) {
    for (const word of shuffle(tier, rng)) {
      if (chosen.length >= count) break;
      if (used.has(word.id)) continue;
      used.add(word.id);
      chosen.push(word);
    }
    if (chosen.length >= count) break;
  }
  return chosen;
}

/**
 * A ready-to-render question: the target plus shuffled options.
 * @returns {{word: object, options: object[], answerIndex: number}}
 */
export function buildQuestion(target, pool, opts = {}) {
  const { ageBand = 5, rng = Math.random } = opts;
  const choices = CHOICE_COUNT[ageBand] ?? CHOICE_COUNT[5];
  const distractors = pickDistractors(target, pool, choices - 1, opts);
  const options = shuffle([target, ...distractors], rng);
  return { word: target, options, answerIndex: options.findIndex((w) => w.id === target.id) };
}

/** Re-hydrate word objects from stored ids (session log, achievements). */
export const wordsFromIds = (ids) => ids.map(getWord).filter(Boolean);
