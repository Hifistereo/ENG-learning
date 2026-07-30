import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DAY_MS, INTERVALS, MAX_BOX, MASTERY_STREAK,
  newRecord, answer, isMastered, isLearning, isDue, overdueDays,
  accuracy, isLeech, masteryProgress, intervalsFor,
} from '../src/core/srs.js';

const T0 = Date.UTC(2026, 0, 1);

/** Answer a record `n` times in a row. */
function run(rec, results, ageBand = 5, start = T0) {
  let now = start;
  let out = rec;
  for (const ok of results) {
    out = answer(out, ok, { ageBand, now });
    now += DAY_MS * 30; // always far enough apart to be due again
  }
  return out;
}

test('a new record is empty and not due', () => {
  const rec = newRecord('cat');
  assert.equal(rec.box, 0);
  assert.equal(rec.seen, 0);
  assert.equal(isDue(rec, T0), false, 'never-seen words are not "due" — they are new');
  assert.equal(accuracy(rec), null);
  assert.equal(masteryProgress(rec), 0);
});

test('answer does not mutate its input', () => {
  const rec = newRecord('cat');
  const next = answer(rec, true, { now: T0 });
  assert.equal(rec.box, 0);
  assert.equal(next.box, 1);
  assert.notEqual(rec, next);
});

test('a correct answer promotes one box and schedules by the age ladder', () => {
  const rec = answer(newRecord('cat'), true, { ageBand: 5, now: T0 });
  assert.equal(rec.box, 1);
  assert.equal(rec.streak, 1);
  assert.equal(rec.correct, 1);
  assert.equal(rec.seen, 1);
  assert.equal(rec.nextDue, T0 + INTERVALS[5][1] * DAY_MS);
  assert.equal(rec.firstSeen, T0);
});

test('toddlers get the compressed interval ladder', () => {
  const kid5 = run(newRecord('cat'), [true, true, true], 5);
  const kid2 = run(newRecord('cat'), [true, true, true], 2);
  assert.equal(kid2.box, kid5.box, 'same box after the same answers');
  const gap5 = kid5.nextDue - kid5.lastSeen;
  const gap2 = kid2.nextDue - kid2.lastSeen;
  assert.ok(gap2 < gap5, `age 2 should come back sooner (${gap2} vs ${gap5})`);
  assert.equal(gap2, INTERVALS[2][3] * DAY_MS);
});

test('intervalsFor falls back to the older ladder for unknown bands', () => {
  assert.deepEqual(intervalsFor(99), INTERVALS[5]);
  assert.deepEqual(intervalsFor(2), INTERVALS[2]);
});

test('box never exceeds MAX_BOX no matter how many correct answers', () => {
  const rec = run(newRecord('cat'), Array(12).fill(true));
  assert.equal(rec.box, MAX_BOX);
  assert.equal(rec.correct, 12);
});

test('a wrong answer demotes by one and never below box 1', () => {
  let rec = run(newRecord('cat'), [true, true, true]);   // box 3
  assert.equal(rec.box, 3);
  rec = answer(rec, false, { now: T0 });
  assert.equal(rec.box, 2, 'demote by one, not a full reset');
  assert.equal(rec.streak, 0);
  rec = run(rec, [false, false, false, false]);
  assert.equal(rec.box, 1, 'floor at 1 so a bad day cannot erase a word');
});

test('an unbroken run of correct answers reaches mastery', () => {
  const rec = run(newRecord('cat'), Array(MAX_BOX).fill(true));
  assert.equal(rec.box, MAX_BOX);
  assert.equal(rec.streak, MAX_BOX);
  assert.equal(isMastered(rec), true, 'never missed once — that is mastered');
  assert.equal(isLearning(rec), false);
});

test('a word that was forgotten must re-earn its streak at the top box', () => {
  // Climb to the top, then miss it once: box drops and the streak resets.
  let rec = run(newRecord('cat'), Array(MAX_BOX).fill(true));
  rec = answer(rec, false, { now: T0 });
  assert.equal(isMastered(rec), false, 'forgetting it drops mastery again');
  assert.equal(isLearning(rec), true);
  assert.equal(rec.streak, 0);

  // Back at the top box, but on a fresh streak — not mastered yet.
  rec = answer(rec, true, { now: T0 });
  assert.equal(rec.box, MAX_BOX);
  assert.equal(rec.streak, 1);
  assert.equal(isMastered(rec), false, 'top box alone is not enough after a miss');

  rec = run(rec, Array(MASTERY_STREAK - 2).fill(true));
  assert.equal(rec.streak, MASTERY_STREAK - 1);
  assert.equal(isMastered(rec), false);

  rec = answer(rec, true, { now: T0 });
  assert.equal(rec.streak, MASTERY_STREAK);
  assert.equal(isMastered(rec), true);
});

test('due-ness follows the schedule', () => {
  const rec = answer(newRecord('cat'), true, { ageBand: 5, now: T0 }); // due in 1 day
  assert.equal(isDue(rec, T0), false);
  assert.equal(isDue(rec, T0 + DAY_MS - 1000), false);
  assert.equal(isDue(rec, T0 + DAY_MS), true);
  assert.equal(Math.round(overdueDays(rec, T0 + 3 * DAY_MS)), 2);
});

test('overdueDays orders the review queue oldest-first', () => {
  const a = answer(newRecord('a'), true, { now: T0 });
  const b = answer(newRecord('b'), true, { now: T0 + 5 * DAY_MS });
  const now = T0 + 20 * DAY_MS;
  assert.ok(overdueDays(a, now) > overdueDays(b, now), 'a has waited longer');
});

test('accuracy and leech detection', () => {
  const good = run(newRecord('cat'), [true, true, true, true]);
  assert.equal(accuracy(good), 1);
  assert.equal(isLeech(good), false);

  // 4 wrong, 2 right => accuracy 0.33 with 4 misses: a leech.
  const bad = run(newRecord('dog'), [false, false, true, false, true, false]);
  assert.equal(bad.wrong, 4);
  assert.ok(accuracy(bad) < 0.5);
  assert.equal(isLeech(bad), true, 'parents should be told about this word');

  // 3 wrong is under the threshold, however bad the ratio.
  const notYet = run(newRecord('pig'), [false, false, false]);
  assert.equal(isLeech(notYet), false);
});

test('masteryProgress rises monotonically and tops out at 1', () => {
  let rec = newRecord('cat');
  let last = 0;
  for (let i = 0; i < MAX_BOX + MASTERY_STREAK; i += 1) {
    rec = answer(rec, true, { now: T0 });
    const p = masteryProgress(rec);
    assert.ok(p >= last, `progress went backwards at step ${i}`);
    assert.ok(p <= 1);
    last = p;
  }
  assert.equal(masteryProgress(rec), 1);
  assert.equal(isMastered(rec), true);
});
