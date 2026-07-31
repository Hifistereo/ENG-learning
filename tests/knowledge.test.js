import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  EVIDENCE, ACTIVITY_EVIDENCE, DELAY_DAYS,
  emptyEvidence, hasEvidence, credit, knowledgeLevel, isKnown, isLearning,
  isRetained, knowledgeProgress, readyForTransfer, readyForProduction,
  needsSupport, wordEvidence,
} from '../src/core/knowledge.js';
import { newRecord, answer } from '../src/core/srs.js';
import { DAY_MS } from '../src/core/time.js';

const T0 = Date.UTC(2026, 5, 1);

/** A record first met at T0 and answered `n` times correctly, all same-day. */
function sameDayDrill(n, activity = 'listenTap') {
  let rec = newRecord('cat');
  for (let i = 0; i < n; i += 1) {
    rec = answer(rec, true, { now: T0 + i * 1000, activity });
  }
  return rec;
}

// --- The core claim ------------------------------------------------------

test('twenty correct taps in one sitting do not make a word known', () => {
  // This is the failure the whole module exists to prevent: the old model
  // called this mastered after five.
  const rec = sameDayDrill(20);
  assert.equal(rec.correct, 20);
  assert.equal(hasEvidence(rec, 'recognise'), true);
  assert.equal(hasEvidence(rec, 'transfer'), false);
  assert.equal(hasEvidence(rec, 'delay1'), false);
  assert.equal(isKnown(rec, 5), false, 'no transfer, no delayed recall — not known');
  assert.equal(isKnown(rec, 2), false);
  assert.equal(knowledgeLevel(rec), 2);
});

test('one correct answer a week later is worth more than twenty on the day', () => {
  const drilled = sameDayDrill(20);
  const spaced = answer(
    answer(newRecord('dog'), true, { now: T0, activity: 'listenTap' }),
    true,
    { now: T0 + 8 * DAY_MS, activity: 'listenTap' },
  );
  assert.equal(spaced.seen, 2);
  assert.ok(knowledgeLevel(spaced) > knowledgeLevel(drilled),
    'delayed recall is the stronger evidence, despite one tenth the answers');
  assert.equal(hasEvidence(spaced, 'delay1'), true);
  assert.equal(hasEvidence(spaced, 'delay7'), true);
});

// --- What each activity can prove ----------------------------------------

test('an activity can only grant the evidence it actually demonstrates', () => {
  // Tapping a picture is never production, however many times it happens.
  let rec = newRecord('cat');
  for (let i = 0; i < 10; i += 1) rec = answer(rec, true, { now: T0, activity: 'listenTap' });
  assert.equal(hasEvidence(rec, 'produce'), false);
  assert.equal(hasEvidence(rec, 'transfer'), false);

  // Only the transfer activity grants transfer.
  const t = answer(rec, true, { now: T0, activity: 'transfer' });
  assert.equal(hasEvidence(t, 'transfer'), true);

  // Only teaching the character grants production.
  const p = answer(rec, true, { now: T0, activity: 'teach' });
  assert.equal(hasEvidence(p, 'produce'), true);
});

test('phonics is literacy practice and grants no word knowledge', () => {
  assert.equal(ACTIVITY_EVIDENCE.phonics, null);
  const rec = answer(newRecord('cat'), true, { now: T0, activity: 'phonics' });
  assert.equal(hasEvidence(rec, 'recognise'), false,
    'knowing a word starts with c is not knowing what it means');
});

test('every activity key maps to a real evidence kind or explicit null', () => {
  for (const [activity, kind] of Object.entries(ACTIVITY_EVIDENCE)) {
    assert.ok(kind === null || EVIDENCE.includes(kind),
      `${activity} maps to unknown evidence "${kind}"`);
  }
});

// --- Aided answers -------------------------------------------------------

test('an answer given after a hint proves nothing', () => {
  const rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap', aided: true });
  assert.equal(rec.seen, 1);
  assert.equal(rec.correct, 1, 'it still counts as practice');
  assert.equal(rec.help, 1);
  assert.equal(hasEvidence(rec, 'recognise'), false,
    'following the pet is not the same as knowing the word');
  assert.equal(knowledgeLevel(rec), 1);
});

test('a wrong answer grants nothing, including delayed credit', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  rec = answer(rec, false, { now: T0 + 30 * DAY_MS, activity: 'listenTap' });
  assert.equal(hasEvidence(rec, 'delay1'), false);
  assert.equal(hasEvidence(rec, 'delay7'), false);
});

// --- Delayed recall ------------------------------------------------------

test('delayed credit is earned by any unaided success, whatever the activity', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  rec = answer(rec, true, { now: T0 + DELAY_DAYS.delay1 * DAY_MS, activity: 'order' });
  assert.equal(hasEvidence(rec, 'delay1'), true);
  assert.equal(hasEvidence(rec, 'delay7'), false, 'a day is not a week');
});

test('delayed credit is measured from the first meeting, not the last answer', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  // Practised daily for a fortnight: the week credit lands on schedule.
  for (let d = 1; d <= 8; d += 1) {
    rec = answer(rec, true, { now: T0 + d * DAY_MS, activity: 'listenTap' });
  }
  assert.equal(hasEvidence(rec, 'delay7'), true);
  assert.equal(rec.firstSeen, T0);
});

test('credit never overwrites an earlier timestamp', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  const first = rec.ev.recognise;
  rec = answer(rec, true, { now: T0 + 5 * DAY_MS, activity: 'listenTap' });
  assert.equal(rec.ev.recognise, first, 'evidence records when it was first earned');
});

// --- Levels and the mastery bar ------------------------------------------

test('the level ladder climbs in the intended order', () => {
  let rec = newRecord('cat');
  assert.equal(knowledgeLevel(rec), 0);

  rec = answer(rec, false, { now: T0, activity: 'listenTap' });
  assert.equal(knowledgeLevel(rec), 1, 'met but nothing proved');

  rec = answer(rec, true, { now: T0, activity: 'listenTap' });
  assert.equal(knowledgeLevel(rec), 2, 'recognises');

  rec = answer(rec, true, { now: T0, activity: 'transfer' });
  assert.equal(knowledgeLevel(rec), 3, 'recognises a different picture');

  rec = answer(rec, true, { now: T0 + 2 * DAY_MS, activity: 'listenTap' });
  assert.equal(knowledgeLevel(rec), 4, 'still there the next day');

  rec = answer(rec, true, { now: T0 + 9 * DAY_MS, activity: 'teach' });
  assert.equal(knowledgeLevel(rec), 5, 'says it, and still there after a week');
});

test('the level never goes down, even after a run of wrong answers', () => {
  let rec = newRecord('cat');
  rec = answer(rec, true, { now: T0, activity: 'listenTap' });
  rec = answer(rec, true, { now: T0, activity: 'transfer' });
  const before = knowledgeLevel(rec);

  for (let i = 0; i < 5; i += 1) rec = answer(rec, false, { now: T0 + DAY_MS, activity: 'listenTap' });
  assert.equal(knowledgeLevel(rec), before,
    'evidence already earned is a fact about the past; the scheduler handles the forgetting');
  assert.ok(rec.box < 3, 'but it comes back around much sooner');
});

test('toddlers are not required to speak; older children are', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  rec = answer(rec, true, { now: T0, activity: 'transfer' });
  rec = answer(rec, true, { now: T0 + 2 * DAY_MS, activity: 'listenTap' });

  assert.equal(isKnown(rec, 2), true, 'a 2-year-old understands far more than they say');
  assert.equal(isKnown(rec, 5), false, 'age 5 must also produce it');

  rec = answer(rec, true, { now: T0 + 3 * DAY_MS, activity: 'teach' });
  assert.equal(isKnown(rec, 5), true);
});

test('isLearning is the complement of isKnown for words that have been met', () => {
  assert.equal(isLearning(newRecord('cat'), 5), false, 'never met is not learning');
  const rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  assert.equal(isLearning(rec, 5), true);
});

test('knowledgeProgress is monotonic and bounded', () => {
  let rec = newRecord('cat');
  let last = 0;
  const steps = [
    ['listenTap', T0], ['transfer', T0],
    ['listenTap', T0 + 2 * DAY_MS], ['teach', T0 + 9 * DAY_MS],
  ];
  for (const [activity, now] of steps) {
    rec = answer(rec, true, { now, activity });
    const p = knowledgeProgress(rec);
    assert.ok(p >= last && p <= 1, `progress went backwards or out of range at ${activity}`);
    last = p;
  }
  assert.equal(knowledgeProgress(rec), 1);
  assert.equal(isRetained(rec), true);
});

// --- Gating --------------------------------------------------------------

test('transfer is only offered once plain recognition is established', () => {
  const fresh = newRecord('cat');
  assert.equal(readyForTransfer(fresh), false,
    'a strange picture of a word they have not pinned down teaches confusion');

  const known = answer(fresh, true, { now: T0, activity: 'listenTap' });
  assert.equal(readyForTransfer(known), true);

  const done = answer(known, true, { now: T0, activity: 'transfer' });
  assert.equal(readyForTransfer(done), false, 'already proved');
});

test('production is only asked for once the word transfers', () => {
  let rec = answer(newRecord('cat'), true, { now: T0, activity: 'listenTap' });
  assert.equal(readyForProduction(rec), false, 'recognition alone is too early to ask for speech');

  rec = answer(rec, true, { now: T0, activity: 'transfer' });
  assert.equal(readyForProduction(rec), true);

  rec = answer(rec, true, { now: T0, activity: 'teach' });
  assert.equal(readyForProduction(rec), false);
});

// --- Support -------------------------------------------------------------

test('needsSupport flags words that are failing or leaning on hints', () => {
  assert.equal(needsSupport(newRecord('cat')), false);

  let failing = newRecord('dog');
  for (let i = 0; i < 5; i += 1) failing = answer(failing, i === 0, { now: T0 });
  assert.equal(needsSupport(failing), true, 'accuracy under 60%');

  // Right every time, but only ever with a hint.
  let propped = newRecord('pig');
  for (let i = 0; i < 5; i += 1) propped = answer(propped, true, { now: T0, aided: true });
  assert.equal(propped.correct, 5);
  assert.equal(needsSupport(propped), true, 'always right, never unaided — that needs saying');
});

// --- Shape ---------------------------------------------------------------

test('evidence survives records that predate it', () => {
  // v0.1 records have no `ev` at all; nothing may throw on them.
  const legacy = { id: 'cat', box: 3, streak: 2, seen: 6, correct: 5, wrong: 1, lastSeen: T0, firstSeen: T0 };
  assert.doesNotThrow(() => knowledgeLevel(legacy));
  assert.equal(knowledgeLevel(legacy), 1);
  assert.equal(isKnown(legacy, 5), false);
  assert.deepEqual(credit(legacy, { activity: 'listenTap', correct: true, now: T0 }).recognise, T0);
  assert.equal(wordEvidence(legacy, 5).seen, 6);
});

test('emptyEvidence covers every declared evidence kind', () => {
  const empty = emptyEvidence();
  for (const kind of EVIDENCE) assert.ok(kind in empty, `missing ${kind}`);
});
