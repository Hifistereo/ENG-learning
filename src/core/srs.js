// Spaced repetition — a Leitner box system tuned for small children.
//
// Why Leitner and not SM-2/FSRS: those algorithms need a self-reported
// difficulty rating after each card. A 2-year-old cannot give one, and asking
// a 5-year-old "how hard was that?" changes the activity into a test. Leitner
// only needs right/wrong, which we already observe.
//
// Every function here is pure. No storage, no DOM, no clock unless passed in —
// that is what makes the whole scheduling layer unit-testable.

import { credit as creditEvidence } from './knowledge.js';
import { DAY_MS } from './time.js';

export { DAY_MS };

// Days to wait before showing a word again, indexed by box.
//
// The shape that matters is the front of the ladder: a checkpoint the very
// next day, then roughly three days, then a week. The next-day check is the
// first real evidence that anything was retained rather than just held in
// mind for the length of a session, which is why no box skips past it.
//
// Toddlers forget faster and tolerate repetition better, so their ladder is
// compressed. Both are starting hypotheses to be tuned against what the
// children actually retain — not settled formulas.
export const INTERVALS = {
  2: [0, 1, 2, 4, 7, 14],
  5: [0, 1, 3, 7, 14, 30],
};

export const MAX_BOX = 5;

/** Correct answers in a row at the top box before a word counts as mastered. */
export const MASTERY_STREAK = 3;

/** A word is flagged for the parent once it has this many wrong answers... */
const LEECH_WRONG = 4;
/** ...and its accuracy is below this. */
const LEECH_ACCURACY = 0.5;

/** Fresh record for a word the child has never met. */
export function newRecord(wordId) {
  return {
    id: wordId,
    box: 0,
    streak: 0,
    seen: 0,
    correct: 0,
    wrong: 0,
    help: 0,          // times a hint was needed — an aided answer proves nothing
    lastSeen: 0,
    nextDue: 0,
    firstSeen: 0,
    // What the child has actually demonstrated. See core/knowledge.js — this,
    // not the box number, is what "knows this word" is measured against.
    ev: { recognise: 0, transfer: 0, produce: 0, delay1: 0, delay7: 0 },
  };
}

export function intervalsFor(ageBand) {
  return INTERVALS[ageBand] || INTERVALS[5];
}

/**
 * Apply one answer to a record.
 *
 * This handles *scheduling* only — when the word should come back. What the
 * answer proves about the child's knowledge is core/knowledge.js's job, and
 * the two are kept apart on purpose: a word can be scheduled far out while
 * still being weakly known, and vice versa.
 *
 * @param {object} rec
 * @param {boolean} correct
 * @param {{ageBand?: number, now?: number, aided?: boolean, activity?: string}} [opts]
 * @returns {object} a new record — the input is never mutated
 */
export function answer(rec, correct, opts = {}) {
  const { ageBand = 5, now = Date.now(), aided = false, activity = 'listenTap' } = opts;
  const ladder = intervalsFor(ageBand);
  const next = { ...rec };

  next.seen = rec.seen + 1;
  next.lastSeen = now;
  if (!rec.firstSeen) next.firstSeen = now;
  if (aided) next.help = (rec.help || 0) + 1;

  next.ev = creditEvidence(rec, { activity, correct, aided, now });

  if (correct) {
    next.correct = rec.correct + 1;
    next.streak = rec.streak + 1;
    next.box = Math.min(MAX_BOX, rec.box + 1);
  } else {
    next.wrong = rec.wrong + 1;
    next.streak = 0;
    // Demote by one rather than resetting to zero. A full reset after a single
    // distracted tap is demoralising and, at this age, usually wrong about
    // what the child actually knows.
    next.box = Math.max(1, rec.box - 1);
  }

  next.nextDue = now + ladder[next.box] * DAY_MS;
  return next;
}

/**
 * Whether the word is scheduled as "settled" — the box ladder's own view.
 *
 * This is NOT the same as knowing the word, and callers almost always want
 * knowledge.isKnown() instead. Reaching the top box means the scheduler has
 * stopped asking often; it says nothing about whether the child could pick
 * the word out from a different picture or say it out loud.
 */
export function isScheduledSettled(rec) {
  return !!rec && rec.box >= MAX_BOX && rec.streak >= MASTERY_STREAK;
}

export function isDue(rec, now = Date.now()) {
  if (!rec || rec.seen === 0) return false;
  return rec.nextDue <= now;
}

/** How far past due, in days. Negative means not due yet. Used for ordering. */
export function overdueDays(rec, now = Date.now()) {
  if (!rec || rec.seen === 0) return 0;
  return (now - rec.nextDue) / DAY_MS;
}

export function accuracy(rec) {
  if (!rec || rec.seen === 0) return null;
  return rec.correct / rec.seen;
}

/** A word that keeps being forgotten — surfaced to parents, never to the child. */
export function isLeech(rec) {
  if (!rec || rec.seen === 0) return false;
  return rec.wrong >= LEECH_WRONG && accuracy(rec) < LEECH_ACCURACY;
}

/**
 * When this word is next worth checking, as a plain date.
 *
 * Used by the parent page so "nākamā pārbaude" is something a person can read,
 * rather than a box number that means nothing outside this file.
 */
export function dueDate(rec) {
  return rec?.nextDue ? new Date(rec.nextDue) : null;
}
