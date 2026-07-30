// Spaced repetition — a Leitner box system tuned for small children.
//
// Why Leitner and not SM-2/FSRS: those algorithms need a self-reported
// difficulty rating after each card. A 2-year-old cannot give one, and asking
// a 5-year-old "how hard was that?" changes the activity into a test. Leitner
// only needs right/wrong, which we already observe.
//
// Every function here is pure. No storage, no DOM, no clock unless passed in —
// that is what makes the whole scheduling layer unit-testable.

export const DAY_MS = 86_400_000;

// Days to wait before showing a word again, indexed by box.
// Toddlers forget faster and tolerate repetition better, so their ladder is
// compressed; the five-year-old's stretches out to fortnightly.
export const INTERVALS = {
  2: [0, 1, 1, 2, 3, 5],
  5: [0, 1, 2, 4, 8, 16],
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
    lastSeen: 0,
    nextDue: 0,
    firstSeen: 0,
  };
}

export function intervalsFor(ageBand) {
  return INTERVALS[ageBand] || INTERVALS[5];
}

/**
 * Apply one answer to a record.
 * @param {object} rec
 * @param {boolean} correct
 * @param {{ageBand?: number, now?: number}} [opts]
 * @returns {object} a new record — the input is never mutated
 */
export function answer(rec, correct, { ageBand = 5, now = Date.now() } = {}) {
  const ladder = intervalsFor(ageBand);
  const next = { ...rec };

  next.seen = rec.seen + 1;
  next.lastSeen = now;
  if (!rec.firstSeen) next.firstSeen = now;

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

export function isMastered(rec) {
  return !!rec && rec.box >= MAX_BOX && rec.streak >= MASTERY_STREAK;
}

/** Met at least once but not yet mastered. */
export function isLearning(rec) {
  return !!rec && rec.seen > 0 && !isMastered(rec);
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
 * Progress toward mastery as 0..1, for progress bars.
 * Blends box position with the streak needed at the top box so the bar keeps
 * moving during the final three correct answers instead of sticking at 100%.
 */
export function masteryProgress(rec) {
  if (!rec || rec.seen === 0) return 0;
  const boxPart = Math.min(rec.box, MAX_BOX) / MAX_BOX;
  if (rec.box < MAX_BOX) return boxPart * 0.8;
  return 0.8 + 0.2 * Math.min(rec.streak, MASTERY_STREAK) / MASTERY_STREAK;
}
