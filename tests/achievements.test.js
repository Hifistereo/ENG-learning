import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CARDS, getCard, TOTAL_CARDS } from '../src/data/achievements.js';
import { qualifyingCards, newlyEarned, rewardsFor, collection, unlockedCount }
  from '../src/core/achievements.js';
import { snapshot, currentStreak, bestStreak, dailyActivity, windowTotals, weakWords }
  from '../src/core/stats.js';
import { DAY_MS, newRecord, answer } from '../src/core/srs.js';
import { emptyProgress, makeKnown } from './helpers.js';
import { WORDS, wordsInUnit } from '../src/data/words.js';

const T0 = new Date(2026, 5, 15, 12, 0, 0).getTime();   // local noon
const profile = (ageBand = 5) => ({ id: 'kid', name: 'Test', ageBand, settings: {} });

/** A word the child genuinely knows: transfer, delayed recall and production. */
function master(progress, wordId, ageBand = 5) {
  makeKnown(progress, wordId, { ageBand, firstSeen: T0 - 30 * DAY_MS });
}

/** Add `count` sessions on consecutive days ending `endingDaysAgo` days ago. */
function addStreak(progress, count, endingDaysAgo = 0, extra = {}) {
  for (let i = 0; i < count; i += 1) {
    const ts = T0 - (endingDaysAgo + i) * DAY_MS;
    progress.sessions.push({ ts, ms: 300000, n: 10, ok: 8, words: [], acts: ['listenTap'], ...extra });
  }
  progress.sessions.sort((a, b) => a.ts - b.ts);
  progress.totals.sessions = progress.sessions.length;
}

// --- Catalogue integrity -------------------------------------------------

test('every card is well formed and ids are unique', () => {
  const ids = new Set();
  for (const card of CARDS) {
    assert.match(card.id, /^[a-z0-9_]+$/, `bad id: ${card.id}`);
    assert.ok(!ids.has(card.id), `duplicate id: ${card.id}`);
    ids.add(card.id);
    assert.ok(card.title, `${card.id} needs a title`);
    assert.ok(card.hint, `${card.id} needs a hint — a locked card must show its goal`);
    assert.ok(['bronze', 'silver', 'gold', 'rainbow'].includes(card.tier), `${card.id} bad tier`);
    assert.equal(typeof card.test, 'function');
  }
  assert.equal(ids.size, TOTAL_CARDS);
});

test('no card fires on an empty history', () => {
  const snap = snapshot(emptyProgress(), profile(), T0);
  assert.deepEqual(qualifyingCards(snap), [],
    'a child who has never played should have an empty collection');
});

test('a card whose condition throws is skipped, not fatal', () => {
  const broken = { id: 'broken', tier: 'bronze', emoji: '💥', title: 'x', hint: 'x',
    test: () => { throw new Error('boom'); } };
  CARDS.push(broken);
  try {
    const progress = emptyProgress();
    addStreak(progress, 1);
    const earned = qualifyingCards(snapshot(progress, profile(), T0));
    assert.ok(earned.includes('first_session'), 'other cards still evaluate');
    assert.ok(!earned.includes('broken'));
  } finally {
    CARDS.pop();
  }
});

// --- Unlocking -----------------------------------------------------------

test('the first session unlocks the first-steps card', () => {
  const progress = emptyProgress();
  addStreak(progress, 1);
  assert.ok(newlyEarned(progress, profile(), T0).includes('first_session'));
});

test('cards unlock exactly at their threshold, not before', () => {
  const progress = emptyProgress();
  addStreak(progress, 1);

  WORDS.slice(0, 9).forEach((w) => master(progress, w.id));
  assert.ok(!newlyEarned(progress, profile(), T0).includes('words_10'), '9 words is not 10');

  master(progress, WORDS[9].id);
  assert.ok(newlyEarned(progress, profile(), T0).includes('words_10'));
  assert.ok(!newlyEarned(progress, profile(), T0).includes('words_25'));
});

test('a card is never earned twice', () => {
  const progress = emptyProgress();
  addStreak(progress, 1);
  const first = newlyEarned(progress, profile(), T0);
  assert.ok(first.includes('first_session'));

  // Record them as held, as progress.unlockAchievements would.
  for (const id of first) progress.achievements[id] = T0;

  const second = newlyEarned(progress, profile(), T0);
  assert.equal(second.includes('first_session'), false, 'already held');
  assert.deepEqual(second, [], 'nothing new without new activity');
});

test('a card added to the catalogue later unlocks retroactively', () => {
  // This is the property that makes "we will add more cards later" cheap:
  // history is re-evaluated in full, so no backfill is ever needed.
  const progress = emptyProgress();
  addStreak(progress, 12);
  WORDS.slice(0, 30).forEach((w) => master(progress, w.id));

  // The child plays under today's catalogue and banks everything available.
  for (const id of newlyEarned(progress, profile(), T0)) progress.achievements[id] = T0;
  assert.deepEqual(newlyEarned(progress, profile(), T0), [], 'fully caught up');

  // A future version ships a new card...
  const future = {
    id: 'future_card', tier: 'gold', emoji: '🆕',
    title: 'Jauna balva', hint: 'Apgūsti 20 vārdus',
    test: (s) => s.wordsMastered >= 20,
  };
  CARDS.push(future);
  try {
    const earned = newlyEarned(progress, profile(), T0);
    assert.deepEqual(earned, ['future_card'],
      'the old history alone should unlock it — no replay, no migration');
  } finally {
    CARDS.pop();
  }
});

test('completing a unit unlocks its card', () => {
  const progress = emptyProgress();
  addStreak(progress, 1);
  wordsInUnit('animals').filter((w) => w.level <= 5).forEach((w) => master(progress, w.id));
  assert.ok(newlyEarned(progress, profile(5), T0).includes('unit_animals'));
});

test('a toddler completes a unit without the age-5 words', () => {
  const progress = emptyProgress();
  addStreak(progress, 1);
  wordsInUnit('animals').filter((w) => w.level <= 2).forEach((w) => master(progress, w.id, 2));
  assert.ok(newlyEarned(progress, profile(2), T0).includes('unit_animals'),
    'a 2-year-old must be able to finish a unit at their own level');
  assert.ok(!newlyEarned(progress, profile(5), T0).includes('unit_animals'));
});

test('rewards map to pet accessories and de-duplicate', () => {
  const { accessories } = rewardsFor(['streak_7', 'streak_7', 'words_25', 'first_session']);
  assert.deepEqual(accessories.sort(), ['bow', 'cap']);
  assert.deepEqual(rewardsFor([]).accessories, []);
  assert.deepEqual(rewardsFor(['nonexistent']).accessories, []);
});

test('the collection lists every card in catalogue order with its state', () => {
  const progress = emptyProgress();
  progress.achievements = { first_session: T0 };
  const list = collection(progress);
  assert.equal(list.length, TOTAL_CARDS);
  assert.deepEqual(list.map((e) => e.card.id), CARDS.map((c) => c.id), 'order must be stable');
  assert.equal(list.find((e) => e.card.id === 'first_session').unlocked, true);
  assert.equal(list.find((e) => e.card.id === 'words_100').unlocked, false);
  assert.equal(unlockedCount(progress), 1);
});

// --- Streaks -------------------------------------------------------------

test('a streak counts consecutive days up to today', () => {
  const progress = emptyProgress();
  addStreak(progress, 4);
  assert.equal(currentStreak(progress.sessions, T0), 4);
});

test('playing yesterday keeps the streak alive today', () => {
  const progress = emptyProgress();
  addStreak(progress, 3, 1);            // ended yesterday
  assert.equal(currentStreak(progress.sessions, T0), 3,
    'a late-evening then next-morning pattern must not be punished');
});

test('a missed day quietly ends the streak — there is no broken state', () => {
  const progress = emptyProgress();
  addStreak(progress, 5, 3);            // last played 3 days ago
  assert.equal(currentStreak(progress.sessions, T0), 0);
  assert.equal(bestStreak(progress.sessions), 5, 'the best run is still remembered');
});

test('streak cards stay earned after the streak lapses', () => {
  const progress = emptyProgress();
  addStreak(progress, 7, 10);           // a 7-day run, ten days ago
  assert.equal(currentStreak(progress.sessions, T0), 0);
  assert.ok(newlyEarned(progress, profile(), T0).includes('streak_7'),
    'achievements are gains only — a lapse must never take one away');
});

// --- Stats ---------------------------------------------------------------

test('daily activity returns one entry per day, oldest first', () => {
  const progress = emptyProgress();
  addStreak(progress, 3);
  const days = dailyActivity(progress.sessions, 14, T0);
  assert.equal(days.length, 14);
  assert.ok(days[0].ts < days.at(-1).ts);
  assert.equal(days.at(-1).sessions, 1, 'today');
  assert.equal(days[0].sessions, 0, 'nothing 13 days ago');
  assert.equal(days.at(-1).accuracy, 0.8);
  assert.equal(days[0].accuracy, null, 'no data is null, not zero');
});

test('window totals only count the trailing window', () => {
  const progress = emptyProgress();
  addStreak(progress, 3);          // today, -1, -2
  addStreak(progress, 2, 20);      // long ago
  const week = windowTotals(progress.sessions, 7, T0);
  assert.equal(week.sessions, 3);
  assert.equal(week.minutes, 15);
  assert.equal(week.accuracy, 0.8);
});

test('weak words surface the ones being forgotten, worst first', () => {
  const progress = emptyProgress();

  let bad = newRecord('cat');
  for (let i = 0; i < 5; i += 1) bad = answer(bad, false, { now: T0, activity: 'listenTap' });
  progress.words.cat = bad;

  let solid = newRecord('dog');
  for (let i = 0; i < 3; i += 1) solid = answer(solid, true, { now: T0, activity: 'listenTap' });
  progress.words.dog = solid;

  // Right every time, but only ever after the pet pointed at the answer.
  let propped = newRecord('cow');
  for (let i = 0; i < 4; i += 1) {
    propped = answer(propped, true, { now: T0, activity: 'listenTap', aided: true });
  }
  progress.words.cow = propped;

  const weak = weakWords(progress, 5).map((w) => w.word.id);
  assert.equal(weak[0], 'cat', 'the one being forgotten comes first');
  assert.ok(weak.includes('cow'), 'a word that only works with help is worth mentioning too');
  assert.equal(weak.includes('dog'), false, 'a solid word is not a problem');
});

test('the snapshot exposes what cards need without throwing on sparse data', () => {
  const snap = snapshot({ words: {}, sessions: [] }, profile(), T0);
  assert.equal(snap.wordsMastered, 0);
  assert.equal(snap.streakDays, 0);
  assert.equal(snap.accuracy, null);
  assert.deepEqual(snap.activitiesUsed, []);
  assert.equal(typeof snap.units.animals.total, 'number');
  // Every catalogue card must tolerate this shape.
  assert.doesNotThrow(() => qualifyingCards(snap));
});

test('getCard resolves ids and returns null for unknown ones', () => {
  assert.equal(getCard('streak_7').tier, 'silver');
  assert.equal(getCard('nope'), null);
});
