// What it means to "know" a word.
//
// The previous model counted correct taps: five right answers on a two-picture
// question and the word was marked mastered. That is not knowing a word. A
// child can pass that by remembering which side of the screen the picture was
// on, and it collapses entirely the moment the picture changes.
//
// So mastery here is evidence-based. Each word accumulates independent
// evidence, and each kind can only be earned by a task that actually
// demonstrates it:
//
//   recognise  heard the word, picked the right picture, unaided
//   transfer   did that again with a DIFFERENT picture of the same thing —
//              this is what separates knowing a word from knowing an image
//   produce    said the word out loud, confirmed by a grown-up
//   delay1     got it right at least a day after first meeting it
//   delay7     got it right at least a week after first meeting it
//
// Retention and transfer are the headline measures, not session counts or
// minutes played. A word answered correctly twenty times inside one afternoon
// has produced almost no evidence of learning; the same word answered once,
// a week later, from a picture it has never seen, has produced a lot.
//
// Everything here is pure — no storage, no DOM, and the clock is passed in.

import { DAY_MS } from './time.js';

/** The evidence kinds, in the order a word normally earns them. */
export const EVIDENCE = ['recognise', 'transfer', 'delay1', 'produce', 'delay7'];

/** Minimum age of a word (since first meeting) for a delayed-recall credit. */
export const DELAY_DAYS = { delay1: 1, delay7: 7 };

/**
 * Which evidence a given activity is capable of producing.
 *
 * This mapping is the safeguard against inflated mastery: an activity can only
 * ever grant what it genuinely demonstrates. Tapping a picture never counts as
 * production, and no amount of same-picture recognition counts as transfer.
 */
export const ACTIVITY_EVIDENCE = {
  listenTap: 'recognise',
  order:     'recognise',   // "give me the apple" — comprehension in a goal
  story:     'recognise',   // comprehension that advances the plot
  doAction:  'recognise',   // picked the action matching the command
  transfer:  'transfer',    // same word, alternate picture
  teach:     'produce',     // corrected the character out loud
  phonics:   null,          // a literacy skill, not word knowledge
  sentence:  'recognise',
};

export function emptyEvidence() {
  return { recognise: 0, transfer: 0, produce: 0, delay1: 0, delay7: 0 };
}

export function hasEvidence(rec, kind) {
  return !!rec?.ev?.[kind];
}

/**
 * Record evidence produced by a correct, unaided answer.
 *
 * @param {object} rec - the word's record (not mutated)
 * @param {object} opts
 * @param {string} opts.activity - key into ACTIVITY_EVIDENCE
 * @param {boolean} opts.correct
 * @param {boolean} [opts.aided] - a hint was shown, so this proves nothing
 * @param {number} [opts.now]
 * @returns {object} a new evidence object
 */
export function credit(rec, { activity, correct, aided = false, now = Date.now() }) {
  const ev = { ...emptyEvidence(), ...(rec?.ev || {}) };
  // Only unaided successes are evidence. A word found after the pet pointed at
  // it tells us the child can follow a finger, not that they know the word.
  if (!correct || aided) return ev;

  const kind = ACTIVITY_EVIDENCE[activity];
  if (kind && !ev[kind]) ev[kind] = now;

  // Delayed recall is a property of *when* the answer happened, not of which
  // activity produced it — any unaided success far enough from the first
  // meeting counts.
  const age = rec?.firstSeen ? (now - rec.firstSeen) / DAY_MS : 0;
  for (const [key, days] of Object.entries(DELAY_DAYS)) {
    if (!ev[key] && age >= days) ev[key] = now;
  }
  return ev;
}

/**
 * How well a word is known, 0-5. Monotonic — evidence only accumulates, so
 * this never goes down.
 *
 *   0  not met
 *   1  met, no unaided success yet
 *   2  recognises it
 *   3  ...and one step beyond: either a different picture, or a later day
 *   4  ...and both
 *   5  held for a week, and said out loud
 *
 * Note what this deliberately does NOT do: impose an order on transfer versus
 * delayed recall. Which comes first is an accident of scheduling — a word met
 * on Monday and answered on Tuesday earns delayed credit before it has ever
 * been shown a second picture. Ranking one above the other would make the
 * level jump around for reasons that have nothing to do with the child.
 */
export function knowledgeLevel(rec) {
  if (!rec || !rec.seen) return 0;
  const ev = rec.ev || {};
  if (!ev.recognise) return 1;

  const beyond = (ev.transfer ? 1 : 0) + (ev.delay1 ? 1 : 0);
  if (ev.delay7 && ev.produce && beyond === 2) return 5;
  return 2 + beyond;
}

/**
 * The bar for "this child knows this word".
 *
 * Transfer plus a delayed success. Production is required for the older
 * children but not for toddlers, who understand far more than they say — the
 * research is clear that receptive knowledge comes first and demanding speech
 * from a 2-year-old measures willingness, not learning.
 */
export function isKnown(rec, ageBand = 5) {
  const ev = rec?.ev || {};
  if (!ev.recognise || !ev.transfer || !ev.delay1) return false;
  return ageBand === 2 ? true : !!ev.produce;
}

/** Met, but not yet known. */
export function isLearning(rec, ageBand = 5) {
  return !!rec?.seen && !isKnown(rec, ageBand);
}

/** Held on to for a week — the strongest single signal we collect. */
export const isRetained = (rec) => hasEvidence(rec, 'delay7');

/**
 * 0..1 for progress bars, derived from the level so it can never regress.
 *
 * A word that clears the bar for this child shows as full, so a toddler who
 * genuinely knows a word is not shown at 80% for never having been asked to
 * say it.
 */
export function knowledgeProgress(rec, ageBand = 5) {
  if (isKnown(rec, ageBand)) return 1;
  return knowledgeLevel(rec) / 5;
}

/**
 * Is this word ready to be tested with its alternate picture?
 *
 * Only after plain recognition is established — showing an unfamiliar picture
 * of a word the child has not yet pinned down teaches confusion, not transfer.
 */
export function readyForTransfer(rec) {
  return hasEvidence(rec, 'recognise') && !hasEvidence(rec, 'transfer');
}

/**
 * Is this word ready to be produced out loud?
 *
 * Production is asked for only once the word is understood, including from a
 * second picture. Asking a child to say a word they cannot yet reliably
 * recognise is the fastest way to make them stop trying.
 */
export function readyForProduction(rec) {
  return hasEvidence(rec, 'transfer') && !hasEvidence(rec, 'produce');
}

/**
 * A word that keeps needing help. Surfaced to parents so they can use it in
 * real life, which is where the app cannot reach.
 */
export function needsSupport(rec) {
  if (!rec?.seen || rec.seen < 3) return false;
  const acc = rec.correct / rec.seen;
  const helpRate = (rec.help || 0) / rec.seen;
  return acc < 0.6 || helpRate > 0.4;
}

/** Compact per-word summary for the parent table. */
export function wordEvidence(rec, ageBand = 5) {
  const ev = rec?.ev || {};
  return {
    level: knowledgeLevel(rec),
    known: isKnown(rec, ageBand),
    recognise: !!ev.recognise,
    transfer: !!ev.transfer,
    produce: !!ev.produce,
    delay1: !!ev.delay1,
    delay7: !!ev.delay7,
    help: rec?.help || 0,
    seen: rec?.seen || 0,
    accuracy: rec?.seen ? rec.correct / rec.seen : null,
  };
}
