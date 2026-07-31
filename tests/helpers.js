// Shared test fixtures.
//
// Not named *.test.js, so the runner does not treat it as a suite.

import { newRecord, answer } from '../src/core/srs.js';
import { DAY_MS } from '../src/core/time.js';

export function emptyProgress() {
  return {
    words: {}, achievements: {}, stickers: [], sessions: [], unlockedUnits: [],
    totals: { sessions: 0, items: 0, correct: 0, playedMs: 0, help: 0 },
  };
}

/**
 * Build a record that clears the knowledge bar: recognised, transferred,
 * recalled the next day and after a week, and said out loud.
 *
 * Note how much has to happen. That is the point — under the old model this
 * was five taps on a two-picture question.
 */
export function knownRecord(wordId, { ageBand = 5, firstSeen = Date.UTC(2026, 0, 1) } = {}) {
  let rec = newRecord(wordId);
  rec = answer(rec, true, { ageBand, now: firstSeen, activity: 'listenTap' });
  rec = answer(rec, true, { ageBand, now: firstSeen + 60_000, activity: 'transfer' });
  rec = answer(rec, true, { ageBand, now: firstSeen + 1 * DAY_MS, activity: 'listenTap' });
  rec = answer(rec, true, { ageBand, now: firstSeen + 8 * DAY_MS, activity: 'teach' });
  return rec;
}

/** Put a fully-known record for `wordId` into `progress`. */
export function makeKnown(progress, wordId, opts = {}) {
  progress.words[wordId] = knownRecord(wordId, opts);
  return progress;
}

/** A record that has been met and recognised, but proves nothing further. */
export function seenRecord(wordId, { ageBand = 5, now = Date.UTC(2026, 0, 1) } = {}) {
  return answer(newRecord(wordId), true, { ageBand, now, activity: 'listenTap' });
}

/** A record that is due for review `daysOverdue` days before `now`. */
export function dueRecord(wordId, { daysOverdue = 1, now = Date.UTC(2026, 0, 15), ageBand = 5 } = {}) {
  return answer(newRecord(wordId), true, {
    ageBand,
    now: now - (daysOverdue + 1) * DAY_MS,
    activity: 'listenTap',
  });
}
