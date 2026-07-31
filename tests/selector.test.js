import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  NEW_WORD_CAP, CHOICE_COUNT, newWordAllowance,
  unlockedUnits, unitMastery, availableWords, currentUnit,
  dueWords, newCandidates, buildSession, pickDistractors, buildQuestion,
} from '../src/core/selector.js';
import { UNIT_IDS } from '../src/data/units.js';
import { WORDS, wordsInUnit, getWord } from '../src/data/words.js';
import { newRecord, answer, DAY_MS } from '../src/core/srs.js';
import { emptyProgress, makeKnown, dueRecord } from './helpers.js';

const T0 = Date.UTC(2026, 0, 15);

const profile = (ageBand = 5) => ({ id: 'kid', name: 'Test', ageBand, settings: {} });

/**
 * Give a word a record that clears the knowledge bar. Under the old model
 * this was "answer it five times"; now it takes transfer, delayed recall and
 * production, which is the whole point of the change.
 */
function master(progress, wordId, ageBand = 5) {
  return makeKnown(progress, wordId, { ageBand, firstSeen: T0 - 30 * DAY_MS });
}

/** Give a word a record that is due for review. */
function makeDue(progress, wordId, daysOverdue = 1) {
  progress.words[wordId] = dueRecord(wordId, { daysOverdue, now: T0 });
  return progress;
}

// --- Unlocking -----------------------------------------------------------

test('only the first unit is open to a brand new child', () => {
  assert.deepEqual(unlockedUnits(profile(), emptyProgress()), [UNIT_IDS[0]]);
});

test('mastering 70% of a unit opens the next one', () => {
  const progress = emptyProgress();
  const first = wordsInUnit(UNIT_IDS[0]).filter((w) => w.level <= 5);
  const needed = Math.ceil(first.length * 0.7);
  first.slice(0, needed).forEach((w) => master(progress, w.id));

  const open = unlockedUnits(profile(), progress);
  assert.ok(open.includes(UNIT_IDS[1]), 'second unit should be open');
  assert.ok(!open.includes(UNIT_IDS[2]), 'but not the third');
});

test('a parent can force a later unit open without touching the ones before it', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = ['vehicles'];
  const open = unlockedUnits(profile(), progress);
  assert.ok(open.includes('vehicles'));
  assert.ok(open.includes(UNIT_IDS[0]));
  assert.ok(!open.includes('food'), 'unearned units stay shut');
});

test('unit mastery is measured against age-appropriate words only', () => {
  const progress = emptyProgress();
  const p2 = profile(2);
  const toddlerWords = wordsInUnit('animals').filter((w) => w.level <= 2);
  toddlerWords.forEach((w) => master(progress, w.id, 2));
  assert.equal(unitMastery('animals', p2, progress), 1,
    'a toddler is not held back by words flagged for age 5');
  assert.ok(unitMastery('animals', profile(5), progress) < 1);
});

// --- Pools ---------------------------------------------------------------

test('a 2-year-old never sees level-5 words', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const words = availableWords(profile(2), progress);
  assert.ok(words.length > 0);
  assert.equal(words.every((w) => w.level <= 2), true);
});

test('new candidates come from the current unit, shortest first for toddlers', () => {
  const progress = emptyProgress();
  const candidates = newCandidates(profile(2), progress);
  assert.ok(candidates.length > 0);
  assert.equal(candidates[0].unit, UNIT_IDS[0]);
  const syllables = candidates.map((w) => w.syl);
  assert.deepEqual(syllables, [...syllables].sort((a, b) => a - b),
    'toddler candidates are ordered by syllable count');
});

test('currentUnit advances once a unit has nothing new left', () => {
  const progress = emptyProgress();
  assert.equal(currentUnit(profile(), progress), UNIT_IDS[0]);
  wordsInUnit(UNIT_IDS[0]).forEach((w) => master(progress, w.id));
  assert.equal(currentUnit(profile(), progress), UNIT_IDS[1]);
});

test('due words come back most-overdue first', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  makeDue(progress, 'cat', 10);
  makeDue(progress, 'dog', 2);
  makeDue(progress, 'cow', 30);
  const due = dueWords(profile(), progress, T0).map((w) => w.id);
  assert.deepEqual(due.slice(0, 3), ['cow', 'cat', 'dog']);
});

// --- Session queue -------------------------------------------------------

test('a long session introduces up to the age-band cap', () => {
  for (const age of [2, 5]) {
    const { newWords } = buildSession(profile(age), emptyProgress(), { now: T0, size: 40 });
    assert.equal(newWords.length, NEW_WORD_CAP[age],
      `age ${age} should introduce ${NEW_WORD_CAP[age]} new words when there is room`);
  }
});

test('new words never crowd review out of a short session', () => {
  // Each new word costs 3 slots, so an unbounded cap would fill a 12-item
  // session with 5 new words and leave nothing to review.
  assert.equal(newWordAllowance(5, 12), 2);
  assert.equal(newWordAllowance(5, 18), 3);
  assert.equal(newWordAllowance(2, 8), 1);
  assert.equal(newWordAllowance(5, 40), NEW_WORD_CAP[5], 'the age cap still applies at the top end');
  assert.equal(newWordAllowance(2, 2), 1, 'a session always teaches at least one word');

  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  WORDS.slice(0, 20).forEach((w) => makeDue(progress, w.id, 3));

  const { newWords, reviewWords } = buildSession(profile(5), progress, { now: T0, size: 12 });
  assert.ok(reviewWords.length > 0, 'a short session must still revisit old words');
  assert.ok(newWords.length * 3 <= 12 * 0.5 + 1);
});

test('each new word is practised three times in the session', () => {
  const { queue, newWords } = buildSession(profile(5), emptyProgress(), { now: T0, size: 20 });
  for (const word of newWords) {
    const appearances = queue.filter((s) => s.word.id === word.id).length;
    assert.equal(appearances, 3, `${word.id} should appear 3 times, saw ${appearances}`);
  }
});

test('the same word never appears twice in a row', () => {
  // Run it many times: the interleave has a random component.
  for (let seed = 0; seed < 50; seed += 1) {
    let n = seed;
    const rng = () => ((n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const progress = emptyProgress();
    progress.unlockedUnits = [...UNIT_IDS];
    WORDS.slice(0, 30).forEach((w) => makeDue(progress, w.id, 3));

    const { queue } = buildSession(profile(5), progress, { now: T0, size: 20, rng });
    for (let i = 1; i < queue.length; i += 1) {
      assert.notEqual(queue[i].word.id, queue[i - 1].word.id,
        `back-to-back repeat of ${queue[i].word.id} (seed ${seed})`);
    }
  }
});

test('due reviews are preferred over filler, and filler prevents a short session', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  // Everything seen, nothing due yet.
  WORDS.slice(0, 20).forEach((w) => { progress.words[w.id] = answer(newRecord(w.id), true, { now: T0 }); });
  makeDue(progress, WORDS[0].id, 5);

  const { reviewWords } = buildSession(profile(5), progress, { now: T0, size: 20 });
  assert.equal(reviewWords[0].id, WORDS[0].id, 'the genuinely due word comes first');
  assert.ok(reviewWords.length > 1, 'filler keeps the session from being one item long');
});

test('a session for a child who knows nothing is still playable', () => {
  const { queue, newWords } = buildSession(profile(2), emptyProgress(), { now: T0, size: 8 });
  assert.equal(newWords.length, newWordAllowance(2, 8));
  assert.equal(queue.length, newWords.length * 3, 'each new word gets its three slots');
  assert.equal(queue.every((s) => s.isNew), true, 'with no history, everything is new');
  assert.equal(queue.filter((s) => s.intro).length, newWords.length);
});

// --- Distractors ---------------------------------------------------------

test('distractors come from the same unit when possible', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const pool = availableWords(profile(5), progress);
  const cat = getWord('cat');
  const picks = pickDistractors(cat, pool, 3, { ageBand: 5 });
  assert.equal(picks.length, 3);
  assert.equal(picks.every((w) => w.unit === 'animals'), true);
  assert.equal(picks.some((w) => w.id === 'cat'), false, 'the answer is never a distractor');
});

test('toddler distractors avoid the same initial sound', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const pool = availableWords(profile(2), progress);
  const cat = getWord('cat');
  for (let i = 0; i < 30; i += 1) {
    const picks = pickDistractors(cat, pool, 1, { ageBand: 2 });
    assert.equal(picks.length, 1);
    assert.notEqual(picks[0].en[0].toLowerCase(), 'c',
      'cat/cow is two hard tasks at once for a 2-year-old');
  }
});

test('toddler distractors avoid pictures that look alike', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const pool = availableWords(profile(2), progress);

  // happy 😄, sad 😢 and head 🙂 are all "a round yellow face" — for a
  // pre-literate child, choosing between them is a picture puzzle, not a
  // vocabulary question.
  const happy = getWord('happy');
  assert.equal(happy.look, 'face', 'the fixture depends on this tag');
  for (let i = 0; i < 40; i += 1) {
    const picks = pickDistractors(happy, pool, 1, { ageBand: 2 });
    assert.notEqual(picks[0].look, 'face', `got look-alike "${picks[0].en}"`);
  }
});

test('five-year-olds still get look-alikes — for them that is the lesson', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const pool = availableWords(profile(5), progress);
  const seen = new Set();
  for (let i = 0; i < 60; i += 1) {
    pickDistractors(getWord('happy'), pool, 3, { ageBand: 5 }).forEach((w) => seen.add(w.id));
  }
  assert.ok(seen.has('sad'), 'telling 😄 from 😢 is exactly what age 5 should practise');
});

test('numbers are not taught to toddlers', () => {
  // Matching a spoken word to a written numeral is a literacy skill a
  // 2-year-old does not have; they would be guessing, not learning.
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const toddlerWords = availableWords(profile(2), progress);
  assert.equal(toddlerWords.some((w) => w.unit === 'numbers'), false);
  assert.ok(availableWords(profile(5), progress).some((w) => w.unit === 'numbers'));
});

test('distractor picking degrades instead of failing when the pool is tiny', () => {
  const cat = getWord('cat');
  const tiny = [cat, getWord('cow')];
  const picks = pickDistractors(cat, tiny, 3, { ageBand: 2 });
  assert.equal(picks.length, 1, 'returns what it can rather than throwing');
  assert.equal(picks[0].id, 'cow', 'relaxes the same-initial rule as a last resort');
});

test('buildQuestion offers the right number of choices and knows the answer', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  for (const age of [2, 5]) {
    const pool = availableWords(profile(age), progress);
    const target = pool.find((w) => w.unit === 'animals');
    const q = buildQuestion(target, pool, { ageBand: age });
    assert.equal(q.options.length, CHOICE_COUNT[age]);
    assert.equal(q.options[q.answerIndex].id, target.id);
    assert.equal(new Set(q.options.map((w) => w.id)).size, q.options.length, 'no duplicate options');
  }
});

test('options are actually shuffled, not always in the same slot', () => {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  const pool = availableWords(profile(5), progress);
  const target = getWord('cat');
  const seen = new Set();
  for (let i = 0; i < 60; i += 1) seen.add(buildQuestion(target, pool, { ageBand: 5 }).answerIndex);
  assert.ok(seen.size > 1, 'a child would learn the position, not the word');
});
