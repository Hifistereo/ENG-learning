import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DAY_MS, INTERVALS, MAX_BOX, MASTERY_STREAK,
  newRecord, answer, isScheduledSettled, isDue, overdueDays,
  accuracy, isLeech, intervalsFor, dueDate,
} from '../src/core/srs.js';

const T0 = Date.UTC(2026, 0, 1);

/** Answer a record repeatedly, spaced far enough apart to always be due. */
function run(rec, results, ageBand = 5, start = T0) {
  let now = start;
  let out = rec;
  for (const ok of results) {
    out = answer(out, ok, { ageBand, now });
    now += DAY_MS * 40;
  }
  return out;
}

// This module schedules *when* a word comes back. What an answer proves about
// the child is core/knowledge.js's job — see knowledge.test.js.

test('a new record is empty and not due', () => {
  const rec = newRecord('cat');
  assert.equal(rec.box, 0);
  assert.equal(rec.seen, 0);
  assert.equal(rec.help, 0);
  assert.deepEqual(rec.ev, { recognise: 0, transfer: 0, produce: 0, delay1: 0, delay7: 0 });
  assert.equal(isDue(rec, T0), false, 'never-seen words are not "due" — they are new');
  assert.equal(accuracy(rec), null);
  assert.equal(dueDate(rec), null);
});

test('answer does not mutate its input', () => {
  const rec = newRecord('cat');
  const next = answer(rec, true, { now: T0 });
  assert.equal(rec.box, 0);
  assert.equal(next.box, 1);
  assert.notEqual(rec, next);
  assert.notEqual(rec.ev, next.ev, 'evidence is copied, not shared');
});

test('the ladder checks the next day, then three days, then a week', () => {
  // The front of the schedule is the part that matters: a next-day checkpoint
  // is the first evidence that anything survived the session.
  assert.deepEqual(INTERVALS[5].slice(0, 4), [0, 1, 3, 7]);
  assert.deepEqual(INTERVALS[2].slice(0, 4), [0, 1, 2, 4]);
  assert.equal(INTERVALS[2][1], 1, 'both ages get a next-day check');
});

test('a correct answer promotes one box and schedules by the age ladder', () => {
  const rec = answer(newRecord('cat'), true, { ageBand: 5, now: T0 });
  assert.equal(rec.box, 1);
  assert.equal(rec.streak, 1);
  assert.equal(rec.correct, 1);
  assert.equal(rec.nextDue, T0 + INTERVALS[5][1] * DAY_MS);
  assert.equal(rec.firstSeen, T0);
  assert.equal(dueDate(rec).getTime(), rec.nextDue);
});

test('toddlers come back to a word sooner at every step', () => {
  for (let box = 1; box <= MAX_BOX; box += 1) {
    assert.ok(INTERVALS[2][box] <= INTERVALS[5][box],
      `age 2 should not wait longer than age 5 at box ${box}`);
  }
  const kid2 = run(newRecord('cat'), [true, true, true], 2);
  const kid5 = run(newRecord('cat'), [true, true, true], 5);
  assert.equal(kid2.box, kid5.box);
  assert.ok(kid2.nextDue - kid2.lastSeen < kid5.nextDue - kid5.lastSeen);
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
  let rec = run(newRecord('cat'), [true, true, true]);
  assert.equal(rec.box, 3);
  rec = answer(rec, false, { now: T0 });
  assert.equal(rec.box, 2, 'demote by one, not a full reset');
  assert.equal(rec.streak, 0);
  rec = run(rec, [false, false, false, false]);
  assert.equal(rec.box, 1, 'floor at 1 so a bad day cannot erase a word');
});

test('a forgotten word is rescheduled soon, and that is the point', () => {
  let rec = run(newRecord('cat'), Array(MAX_BOX).fill(true));
  const settledGap = rec.nextDue - rec.lastSeen;
  rec = answer(rec, false, { now: T0 });
  assert.ok(rec.nextDue - rec.lastSeen < settledGap,
    'missing it should bring the word back sooner, not punish the child');
});

test('scheduling "settled" is about the queue, not about knowing the word', () => {
  const rec = run(newRecord('cat'), Array(MAX_BOX + MASTERY_STREAK).fill(true));
  assert.equal(isScheduledSettled(rec), true);
  // Note what this says nothing about: transfer, production or retention.
  // knowledge.isKnown() is the authority on whether the child knows it.
  assert.equal(rec.box, MAX_BOX);
});

test('due-ness follows the schedule', () => {
  const rec = answer(newRecord('cat'), true, { ageBand: 5, now: T0 });
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

test('hints are counted so aided answers can be discounted later', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, aided: true });
  rec = answer(rec, true, { now: T0 + DAY_MS });
  assert.equal(rec.help, 1);
  assert.equal(rec.seen, 2);
});

test('accuracy and leech detection', () => {
  const good = run(newRecord('cat'), [true, true, true, true]);
  assert.equal(accuracy(good), 1);
  assert.equal(isLeech(good), false);

  const bad = run(newRecord('dog'), [false, false, true, false, true, false]);
  assert.equal(bad.wrong, 4);
  assert.ok(accuracy(bad) < 0.5);
  assert.equal(isLeech(bad), true, 'parents should be told about this word');

  const notYet = run(newRecord('pig'), [false, false, false]);
  assert.equal(isLeech(notYet), false);
});
