import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlan, createSession, SCORED } from '../src/core/session.js';
import { UNIT_IDS } from '../src/data/units.js';
import { WORDS } from '../src/data/words.js';
import { newRecord, answer, DAY_MS } from '../src/core/srs.js';

const T0 = Date.UTC(2026, 0, 15);

const profile = (ageBand = 5) => ({ id: 'kid', name: 'Test', ageBand, settings: {} });

function emptyProgress() {
  return { words: {}, achievements: {}, stickers: [], sessions: [], unlockedUnits: [], totals: {} };
}

/** Progress where the child already knows a good chunk of vocabulary. */
function experiencedProgress(ageBand = 5) {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  WORDS.filter((w) => w.level <= ageBand).slice(0, 40).forEach((w) => {
    progress.words[w.id] = answer(newRecord(w.id), true, { ageBand, now: T0 - 5 * DAY_MS });
  });
  return progress;
}

/** Deterministic RNG so plan-shape assertions are stable. */
function seeded(seed = 1) {
  let n = seed;
  return () => ((n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

test('every session opens with a chant and ends with a celebration', () => {
  for (const age of [2, 5]) {
    const { rounds } = buildPlan(profile(age), experiencedProgress(age), { now: T0, rng: seeded(3) });
    assert.equal(rounds[0].type, 'chant', `age ${age} should warm up first`);
    assert.equal(rounds.at(-1).type, 'celebrate');
  }
});

test('the warm-up chant uses words the child already knows', () => {
  const progress = experiencedProgress(5);
  const { chantWords } = buildPlan(profile(5), progress, { now: T0, rng: seeded(7) });
  assert.ok(chantWords.length > 0);
  assert.equal(chantWords.every((w) => progress.words[w.id]), true,
    'opening with unknown words would start the session on a failure');
});

test('a first-ever session still chants, using the new words', () => {
  const { chantWords, rounds } = buildPlan(profile(2), emptyProgress(), { now: T0, rng: seeded(5) });
  assert.ok(chantWords.length > 0, 'no history must not mean no warm-up');
  assert.equal(rounds[0].type, 'chant');
});

test('every session contains exactly one movement break', () => {
  for (const age of [2, 5]) {
    const { rounds } = buildPlan(profile(age), experiencedProgress(age), { now: T0, rng: seeded(11) });
    const tpr = rounds.filter((r) => r.type === 'tpr');
    assert.equal(tpr.length, 1, `age ${age} should get one TPR break`);
    assert.equal(tpr[0].word.tpr, true, 'the break must use an actable verb');
    const at = rounds.indexOf(tpr[0]);
    assert.ok(at > 1 && at < rounds.length - 1, 'the break belongs in the middle, not at either end');
  }
});

test('toddlers only ever meet intro, chant, listen-and-tap, TPR and celebrate', () => {
  const allowed = new Set(['chant', 'intro', 'listenTap', 'tpr', 'celebrate']);
  for (let seed = 1; seed <= 20; seed += 1) {
    const { rounds } = buildPlan(profile(2), experiencedProgress(2), { now: T0, rng: seeded(seed) });
    for (const round of rounds) {
      assert.ok(allowed.has(round.type),
        `age 2 should never see "${round.type}" — variety costs a toddler more than it gives`);
    }
  }
});

test('five-year-olds get a mix of activity types', () => {
  const types = new Set();
  for (let seed = 1; seed <= 20; seed += 1) {
    const { rounds } = buildPlan(profile(5), experiencedProgress(5), { now: T0, size: 24, rng: seeded(seed) });
    rounds.forEach((r) => types.add(r.type));
  }
  for (const expected of ['listenTap', 'phonics', 'sentence', 'sayIt', 'memory']) {
    assert.ok(types.has(expected), `expected "${expected}" to appear across seeds`);
  }
});

test('every new word is introduced before it is ever quizzed', () => {
  for (const age of [2, 5]) {
    for (let seed = 1; seed <= 15; seed += 1) {
      const { rounds, newWords } = buildPlan(profile(age), emptyProgress(), { now: T0, rng: seeded(seed) });
      for (const word of newWords) {
        const introAt = rounds.findIndex((r) => r.type === 'intro' && r.word.id === word.id);
        const quizAt = rounds.findIndex((r) => SCORED.has(r.type) && r.word?.id === word.id);
        assert.ok(introAt > -1, `${word.id} was never introduced`);
        assert.ok(quizAt === -1 || introAt < quizAt,
          `${word.id} was tested before being taught (age ${age}, seed ${seed})`);
      }
    }
  }
});

test('phonics is never used on a word whose spelling misleads', () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    const { rounds } = buildPlan(profile(5), experiencedProgress(5), { now: T0, size: 26, rng: seeded(seed) });
    for (const round of rounds.filter((r) => r.type === 'phonics')) {
      assert.notEqual(round.word.noPhon, true,
        `"${round.word.en}" does not start with the sound of its first letter`);
    }
  }
});

// --- Runtime -------------------------------------------------------------

test('a session walks its rounds and then finishes', () => {
  const session = createSession(profile(5), experiencedProgress(5), { now: T0, rng: seeded(2) });
  assert.ok(session.total > 0);
  assert.equal(session.isFinished(), false);
  let guard = 0;
  while (!session.isFinished() && guard < 500) { session.advance(); guard += 1; }
  assert.ok(session.isFinished());
  assert.equal(session.current(), null);
});

test('progress fraction rises from 0 towards 1', () => {
  const session = createSession(profile(2), experiencedProgress(2), { now: T0, rng: seeded(4) });
  assert.equal(session.fraction, 0);
  let last = 0;
  while (!session.isFinished()) {
    assert.ok(session.fraction >= last);
    last = session.fraction;
    session.advance();
  }
  assert.equal(session.fraction, 1);
});

test('a wrong answer earns another chance at that word later in the session', () => {
  const session = createSession(profile(2), experiencedProgress(2), { now: T0, size: 16, rng: seeded(6) });

  // Target a review word: a brand-new word is already scheduled to repeat, so
  // it would exercise the de-duplication path instead of the retry path.
  while (session.current() && !(session.current().type === 'listenTap' && !session.current().isNew)) {
    session.advance();
  }
  const round = session.current();
  assert.ok(round, 'expected at least one review round in the session');

  const before = session.total;
  session.record(round.word.id, false);
  assert.equal(session.total, before + 1, 'a retry round was added');

  let found = false;
  while (!session.isFinished()) {
    session.advance();
    if (session.current()?.word?.id === round.word.id) found = true;
  }
  assert.ok(found, 'the child must get a chance to succeed with that word before the end');
});

test('repeated wrong answers cannot extend a session forever', () => {
  const session = createSession(profile(2), experiencedProgress(2), { now: T0, rng: seeded(8) });
  const before = session.total;
  let guard = 0;
  while (!session.isFinished() && guard < 400) {
    const round = session.current();
    if (round && SCORED.has(round.type)) session.record(round.word.id, false);
    session.advance();
    guard += 1;
  }
  assert.ok(session.total <= before + 4, `retries are capped, grew by ${session.total - before}`);
  assert.ok(session.isFinished(), 'the session must still terminate');
});

test('a word already scheduled later does not get a duplicate retry', () => {
  const progress = emptyProgress();          // all-new session: each word repeats 3x
  const session = createSession(profile(2), progress, { now: T0, rng: seeded(9) });
  while (session.current() && session.current().type !== 'listenTap') session.advance();
  const round = session.current();
  const before = session.total;
  session.record(round.word.id, false);
  assert.equal(session.total, before, 'it is already coming back — no need to add another');
});

test('the summary is what progress.commitSession expects', () => {
  const session = createSession(profile(5), experiencedProgress(5), { now: T0, rng: seeded(12) });
  while (!session.isFinished()) {
    const round = session.current();
    if (round && SCORED.has(round.type)) {
      // A memory board scores several words in one round; everything else scores one.
      for (const word of round.words || [round.word]) session.record(word.id, true, 1200);
    }
    session.advance();
  }
  const summary = session.summary(T0 + 600000);
  assert.equal(summary.startedAt, T0);
  assert.equal(summary.durationMs, 600000);
  assert.ok(summary.items.length > 0);
  assert.equal(summary.items.every((i) => typeof i.id === 'string' && typeof i.ok === 'boolean'), true);
  assert.ok(summary.activities.length > 0);
  assert.equal(Array.isArray(summary.newWordIds), true);
});
