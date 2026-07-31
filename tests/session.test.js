import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlan, createSession, SCORED, insertRound } from '../src/core/session.js';
import { buildStoryRound, STORY_CHOICES } from '../src/core/storyBuilder.js';
import { STORIES, MOODS } from '../src/data/stories.js';
import { UNIT_IDS, ORDERABLE_UNITS, canOrder } from '../src/data/units.js';
import { WORDS, getWord } from '../src/data/words.js';
import { availableWords } from '../src/core/selector.js';
import { answer, newRecord, DAY_MS } from '../src/core/srs.js';
import { hasEvidence } from '../src/core/knowledge.js';
import { emptyProgress, knownRecord } from './helpers.js';

const T0 = Date.UTC(2026, 0, 15);
const profile = (ageBand = 5) => ({
  id: 'kid', name: 'Test', ageBand,
  settings: { lvHints: true, coPlay: true, petHints: true },
});

/** Progress where the child already knows a good chunk of vocabulary. */
function experiencedProgress(ageBand = 5) {
  const progress = emptyProgress();
  progress.unlockedUnits = [...UNIT_IDS];
  WORDS.filter((w) => w.level <= ageBand).slice(0, 40).forEach((w) => {
    progress.words[w.id] = answer(newRecord(w.id), true, {
      ageBand, now: T0 - 5 * DAY_MS, activity: 'listenTap',
    });
  });
  return progress;
}

function seeded(seed = 1) {
  let n = seed;
  return () => ((n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

const typesIn = (rounds) => new Set(rounds.map((r) => r.type));

// --- Shape ---------------------------------------------------------------

test('a session opens with a warm-up and ends with a celebration', () => {
  for (const age of [2, 5]) {
    const { rounds } = buildPlan(profile(age), experiencedProgress(age), { now: T0, rng: seeded(3) });
    const opening = age === 2 ? 'coplay' : 'chant';
    assert.equal(rounds[0].type, opening, `age ${age} should open with ${opening}`);
    assert.equal(rounds.at(-1).type, 'celebrate');
  }
});

test('toddler sessions always ask for a grown-up first', () => {
  // Screen-only learning transfers poorly under about three; the app says so
  // rather than pretending otherwise.
  for (let seed = 1; seed <= 10; seed += 1) {
    const { rounds } = buildPlan(profile(2), experiencedProgress(2), { now: T0, rng: seeded(seed) });
    assert.equal(rounds[0].type, 'coplay');
  }
  const { rounds: older } = buildPlan(profile(5), experiencedProgress(5), { now: T0, rng: seeded(1) });
  assert.equal(older.some((r) => r.type === 'coplay'), false, 'not for the five-year-old');
});

test('the warm-up chant uses words the child already knows', () => {
  const progress = experiencedProgress(5);
  const { chantWords } = buildPlan(profile(5), progress, { now: T0, rng: seeded(7) });
  assert.ok(chantWords.length > 0);
  assert.equal(chantWords.every((w) => progress.words[w.id]), true,
    'opening with unknown words would start the session on a failure');
});

test('every session contains exactly one movement round, and it is scored', () => {
  for (const age of [2, 5]) {
    const { rounds } = buildPlan(profile(age), experiencedProgress(age), { now: T0, rng: seeded(11) });
    const actions = rounds.filter((r) => r.type === 'doAction');
    assert.equal(actions.length, 1, `age ${age} should get one movement round`);
    assert.equal(actions[0].word.tpr, true, 'it must use an actable verb');
    assert.ok(SCORED.has('doAction'),
      'movement used to be an unscored break; linking it to retrieval is the point');
  }
});

test('the order game only ever asks for things you can hand over', () => {
  // "Give me the apple" is English. "Give me hello", "Give me red", "Give me
  // jump", "Give me the rain" are not, and teaching a child a sentence no
  // speaker would say is worse than teaching them nothing.
  for (const age of [2, 5]) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const { rounds } = buildPlan(profile(age), experiencedProgress(age), {
        now: T0, size: 26, rng: seeded(seed),
      });
      for (const round of rounds.filter((r) => r.type === 'order')) {
        assert.ok(canOrder(round.word),
          `"Give me the ${round.word.en}" — ${round.word.unit} is not a giveable thing`);
      }
    }
  }
});

test('every orderable unit really does contain handable objects', () => {
  for (const unit of ORDERABLE_UNITS) {
    assert.ok(UNIT_IDS.includes(unit), `unknown unit "${unit}"`);
  }
  for (const unit of ['colors', 'actions', 'feelings', 'numbers', 'body', 'family', 'nature']) {
    assert.equal(ORDERABLE_UNITS.has(unit), false, `"${unit}" must not be orderable`);
  }
});

test('the memory board is gone', () => {
  // It could be won by tracking card positions without processing English.
  for (let seed = 1; seed <= 20; seed += 1) {
    for (const age of [2, 5]) {
      const { rounds } = buildPlan(profile(age), experiencedProgress(age), { now: T0, size: 26, rng: seeded(seed) });
      assert.equal(typesIn(rounds).has('memory'), false);
    }
  }
});

test('toddlers meet only receptive tasks — never phonics, sentences or speaking', () => {
  const allowed = new Set(['coplay', 'chant', 'intro', 'listenTap', 'order', 'doAction',
    'transfer', 'story', 'farewell', 'celebrate']);
  for (let seed = 1; seed <= 20; seed += 1) {
    const { rounds } = buildPlan(profile(2), experiencedProgress(2), { now: T0, rng: seeded(seed) });
    for (const round of rounds) {
      assert.ok(allowed.has(round.type), `age 2 should never see "${round.type}"`);
    }
  }
});

test('five-year-olds get the full range of tasks across sessions', () => {
  const types = new Set();
  for (let seed = 1; seed <= 25; seed += 1) {
    const progress = experiencedProgress(5);
    // Give a few words enough evidence to earn transfer and production rounds.
    ['cat', 'dog', 'cow'].forEach((id) => { progress.words[id] = knownRecord(id, { firstSeen: T0 - 20 * DAY_MS }); });
    progress.words.pig = answer(newRecord('pig'), true, { now: T0 - DAY_MS, activity: 'listenTap' });

    const { rounds } = buildPlan(profile(5), progress, {
      now: T0, size: 26, rng: seeded(seed),
      pool: availableWords(profile(5), progress),
    });
    rounds.forEach((r) => types.add(r.type));
  }
  for (const expected of ['listenTap', 'order', 'phonics', 'sentence', 'doAction', 'story']) {
    assert.ok(types.has(expected), `expected "${expected}" to appear across seeds`);
  }
});

// --- Spaced retrieval ----------------------------------------------------

test('every new word is introduced before it is ever asked about', () => {
  for (const age of [2, 5]) {
    for (let seed = 1; seed <= 15; seed += 1) {
      const { rounds, newWords } = buildPlan(profile(age), emptyProgress(), { now: T0, rng: seeded(seed) });
      for (const word of newWords) {
        const introAt = rounds.findIndex((r) => r.type === 'intro' && r.word?.id === word.id);
        const askedAt = rounds.findIndex((r) => SCORED.has(r.type) && r.word?.id === word.id);
        assert.ok(introAt > -1, `${word.id} was never introduced`);
        assert.ok(askedAt === -1 || introAt < askedAt,
          `${word.id} was tested before being taught (age ${age}, seed ${seed})`);
      }
    }
  }
});

test('a new word is retrieved immediately after being introduced', () => {
  // The first spaced repetition, and the cheapest one to get right. Nothing —
  // not the movement round, not a transfer check — may be inserted into that
  // gap, or the cheapest repetition quietly becomes the hardest one.
  for (const age of [2, 5]) {
    for (let seed = 1; seed <= 25; seed += 1) {
      const progress = experiencedProgress(age);
      // Give a word transfer eligibility so a transfer check competes for the
      // same insertion point.
      progress.words.cat = answer(newRecord('cat'), true, { now: T0 - DAY_MS, activity: 'listenTap' });

      const { rounds, newWords } = buildPlan(profile(age), progress, {
        now: T0, size: age === 2 ? 8 : 18, rng: seeded(seed),
      });
      for (const word of newWords) {
        const introAt = rounds.findIndex((r) => r.type === 'intro' && r.word?.id === word.id);
        const next = rounds[introAt + 1];
        assert.ok(next && SCORED.has(next.type) && next.word?.id === word.id,
          `age ${age} seed ${seed}: ${word.id} was introduced, then "${next?.type}" — `
          + 'the immediate retrieval was pushed away from its introduction');
      }
    }
  }
});

test('insertRound slides past an introduction rather than splitting the pair', () => {
  const rounds = [
    { type: 'chant' },
    { type: 'intro', word: { id: 'cat' } },
    { type: 'listenTap', word: { id: 'cat' } },
    { type: 'listenTap', word: { id: 'dog' } },
  ];
  // 0.5 of 4 lands at index 2 — exactly between the intro and its retrieval.
  const at = insertRound(rounds, { type: 'doAction', word: { id: 'jump' } }, 0.5);
  assert.notEqual(at, 2, 'must not land between an intro and its retrieval');
  assert.equal(rounds[1].type, 'intro');
  assert.equal(rounds[2].type, 'listenTap');
  assert.equal(rounds[2].word.id, 'cat');
});

test('every new word is checked once more at the very end of the session', () => {
  for (const age of [2, 5]) {
    const { rounds, newWords } = buildPlan(profile(age), emptyProgress(), { now: T0, rng: seeded(4) });
    for (const word of newWords) {
      const final = rounds.filter((r) => r.finalCheck && r.word?.id === word.id);
      assert.equal(final.length, 1, `${word.id} has no end-of-session check`);
      // It must come after the ordinary practice, not among it.
      const at = rounds.indexOf(final[0]);
      assert.ok(at > rounds.length * 0.5, `${word.id}'s final check is too early`);
    }
  }
});

test('a new word is met at least three times in its first session', () => {
  const { rounds, newWords } = buildPlan(profile(5), emptyProgress(), { now: T0, rng: seeded(6) });
  for (const word of newWords) {
    const met = rounds.filter((r) => r.word?.id === word.id).length;
    assert.ok(met >= 3, `${word.id} only appeared ${met} times`);
  }
});

// --- Transfer and production gating --------------------------------------

test('transfer rounds only appear for words that have earned one', () => {
  const progress = experiencedProgress(5);
  progress.words.cat = answer(newRecord('cat'), true, { now: T0 - DAY_MS, activity: 'listenTap' });

  const { rounds } = buildPlan(profile(5), progress, { now: T0, rng: seeded(2) });
  for (const round of rounds.filter((r) => r.type === 'transfer')) {
    assert.ok(round.word.alt, `${round.word.id} has no second picture to show`);
    assert.equal(hasEvidence(progress.words[round.word.id], 'recognise'), true,
      'a strange picture of a word they have not pinned down teaches confusion');
    assert.equal(hasEvidence(progress.words[round.word.id], 'transfer'), false,
      'already proved — no need to ask again');
  }
});

test('toddlers are never asked to speak', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const progress = experiencedProgress(2);
    ['cat', 'dog', 'cow'].forEach((id) => {
      progress.words[id] = knownRecord(id, { ageBand: 2, firstSeen: T0 - 20 * DAY_MS });
    });
    const { rounds } = buildPlan(profile(2), progress, { now: T0, rng: seeded(seed) });
    assert.equal(typesIn(rounds).has('teach'), false,
      'receptive knowledge comes first; demanding speech measures willingness, not learning');
  }
});

test('production is only asked for once a word transfers', () => {
  const progress = experiencedProgress(5);
  ['cat', 'dog'].forEach((id) => { progress.words[id] = knownRecord(id, { firstSeen: T0 - 20 * DAY_MS }); });
  // A word that is recognised but has never transferred must not be spoken yet.
  progress.words.pig = answer(newRecord('pig'), true, { now: T0 - DAY_MS, activity: 'listenTap' });

  const { rounds } = buildPlan(profile(5), progress, { now: T0, rng: seeded(5) });
  for (const round of rounds.filter((r) => r.type === 'teach')) {
    assert.equal(hasEvidence(progress.words[round.word.id], 'transfer'), true,
      `${round.word.id} was asked for out loud before it was understood`);
  }
});

// --- Story ---------------------------------------------------------------

test('the story reuses words the session is already teaching', () => {
  const progress = experiencedProgress(5);
  const targets = [getWord('apple'), getWord('milk'), getWord('bed')];
  const round = buildStoryRound(profile(5), progress, targets, {
    rng: seeded(3),
    pool: availableWords(profile(5), progress),
  });
  assert.ok(round, 'expected a story round');
  const storyWordIds = round.scenes.map((s) => s.word.id);
  assert.ok(storyWordIds.some((id) => targets.some((t) => t.id === id)),
    'the adventure should drill this session\'s vocabulary, not its own private list');
});

test('a story scene offers the right number of pictures and knows its answer', () => {
  for (const age of [2, 5]) {
    const progress = experiencedProgress(age);
    const round = buildStoryRound(profile(age), progress, [getWord('apple')], {
      rng: seeded(9),
      pool: availableWords(profile(age), progress),
    });
    if (!round) continue;
    for (const scene of round.scenes) {
      assert.equal(scene.options.length, STORY_CHOICES[age]);
      assert.ok(scene.options.some((o) => o.id === scene.word.id), 'the answer must be on screen');
      assert.equal(new Set(scene.options.map((o) => o.id)).size, scene.options.length);
    }
  }
});

test('a story is never shipped with fewer than two scenes', () => {
  // One scene is not a story, it is a quiz question with a background.
  for (let seed = 1; seed <= 20; seed += 1) {
    const progress = experiencedProgress(5);
    const round = buildStoryRound(profile(5), progress, [getWord('apple')], {
      rng: seeded(seed),
      pool: availableWords(profile(5), progress),
    });
    if (round) assert.ok(round.scenes.length >= 2);
  }
});

test('a scene never contradicts itself', () => {
  // "The cat is thirsty. Find the bread." is the failure this guards against.
  // A story whose own sentences do not hold together teaches a child that the
  // words are decoration.
  for (const age of [2, 5]) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const progress = experiencedProgress(age);
      for (const story of STORIES) {
        const round = buildStoryRound(profile(age), progress, WORDS.filter((w) => w.level <= age), {
          storyId: story.id, rng: seeded(seed),
          pool: availableWords(profile(age), progress),
        });
        if (!round) continue;
        for (const scene of round.scenes) {
          if (!scene.slotWords) continue;
          assert.ok(scene.slotWords.includes(scene.word.id),
            `"${scene.ask.replace('___', scene.word.en)}" — ${scene.word.en} is not an answer to that`);
        }
      }
    }
  }
});

test('the scene sentence reads as English', () => {
  // The template supplies the determiner, so the slot must take the bare word:
  // "Find the ___" plus "cat" is "Find the cat", never "Find the a cat".
  const progress = experiencedProgress(5);
  for (const story of STORIES) {
    const round = buildStoryRound(profile(5), progress, WORDS, {
      storyId: story.id, rng: seeded(3), pool: availableWords(profile(5), progress),
    });
    if (!round) continue;
    for (const scene of round.scenes) {
      const sentence = scene.ask.replace('___', scene.word.en);
      assert.ok(!/\bthe (a|an) /.test(sentence), `double determiner: "${sentence}"`);
      assert.ok(!/ {2}/.test(sentence), `double space: "${sentence}"`);
      assert.ok(/[.!?]$/.test(sentence), `no end punctuation: "${sentence}"`);
    }
  }
});

test('every authored story is well formed', () => {
  for (const story of STORIES) {
    assert.ok(story.id && story.lv && story.hero?.emoji, `${story.id} is incomplete`);
    assert.ok(story.intro && story.outro, `${story.id} needs an opening and an ending`);
    assert.ok(story.scenes.length >= 2, `${story.id} has too few scenes`);
    for (const scene of story.scenes) {
      assert.ok(scene.ask.includes('___'), `${story.id}: a scene has no slot`);
      assert.ok(UNIT_IDS.includes(scene.slotUnit), `${story.id}: unknown unit ${scene.slotUnit}`);
      assert.ok(scene.win, `${story.id}: a scene has no outcome`);
      for (const id of scene.slotWords || []) {
        const word = getWord(id);
        assert.ok(word, `${story.id}: slotWords names unknown word "${id}"`);
        assert.equal(word.unit, scene.slotUnit,
          `${story.id}: "${id}" is in ${word.unit}, but the scene declares ${scene.slotUnit}`);
      }
      // A constrained slot must be fillable by a toddler too, or the scene
      // silently vanishes from every age-2 session.
      if (scene.slotWords) {
        assert.ok(scene.slotWords.some((id) => getWord(id)?.level <= 2),
          `${story.id}: no toddler-level word can fill "${scene.ask}"`);
      }
    }
  }
});

// --- Runtime -------------------------------------------------------------

test('a session walks its rounds and then finishes', () => {
  const session = createSession(profile(5), experiencedProgress(5), { now: T0, rng: seeded(2) });
  assert.ok(session.total > 0);
  let guard = 0;
  while (!session.isFinished() && guard < 500) { session.advance(); guard += 1; }
  assert.ok(session.isFinished());
  assert.equal(session.current(), null);
});

test('the session exposes no progress fraction', () => {
  // Deliberately gone in v0.3.0. A bar creeping across the top of the screen
  // reads to a small child as a timer running out, and it frames the visit as
  // a quantity to get through. The child learns the session is over when the
  // pet waves goodbye — see activities/farewell.js.
  const session = createSession(profile(2), experiencedProgress(2), { now: T0, rng: seeded(4) });
  assert.equal(session.fraction, undefined);
});

test('every visit ends by leaving the place, then celebrating', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    for (const age of [2, 5]) {
      const { rounds } = buildPlan(profile(age), experiencedProgress(age), { now: T0, rng: seeded(seed) });
      const types = rounds.map((r) => r.type);
      assert.deepEqual(types.slice(-2), ['farewell', 'celebrate'],
        `seed ${seed} age ${age}: the visit must end with a goodbye`);
    }
  }
});

test('a visit happens in one named place', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    for (const age of [2, 5]) {
      const plan = buildPlan(profile(age), experiencedProgress(age), { now: T0, rng: seeded(seed) });
      assert.ok(MOODS[plan.mood], `seed ${seed} age ${age}: "${plan.mood}" is not a real scene`);
    }
  }
});

test('the story is woven into the visit rather than tacked on the end', () => {
  // It used to be round ~15 of 18, so the best part of the app arrived only
  // after the drill was over. It now lands with rounds still to come.
  let checked = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    const { rounds } = buildPlan(profile(5), experiencedProgress(5), { now: T0, size: 16, rng: seeded(seed) });
    const at = rounds.findIndex((r) => r.type === 'story');
    if (at === -1) continue;
    checked += 1;
    assert.ok(at < rounds.length - 3,
      `seed ${seed}: story at ${at} of ${rounds.length} is still the last thing that happens`);
  }
  assert.ok(checked >= 5, 'expected the story to appear in most sessions');
});

test('a wrong answer earns another chance at that word later in the session', () => {
  const session = createSession(profile(2), experiencedProgress(2), { now: T0, size: 16, rng: seeded(6) });
  while (session.current() && !(session.current().type === 'listenTap' && !session.current().isNew)) {
    session.advance();
  }
  const round = session.current();
  assert.ok(round, 'expected at least one review round');

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
    if (round && SCORED.has(round.type) && round.word) session.record(round.word.id, false);
    session.advance();
    guard += 1;
  }
  assert.ok(session.total <= before + 4, `retries are capped, grew by ${session.total - before}`);
  assert.ok(session.isFinished(), 'the session must still terminate');
});

test('the summary is what progress.commitSession expects', () => {
  const session = createSession(profile(5), experiencedProgress(5), { now: T0, rng: seeded(12) });
  while (!session.isFinished()) {
    const round = session.current();
    if (round && SCORED.has(round.type)) {
      const words = round.words
        || round.scenes?.map((s) => s.word)
        || (round.word ? [round.word] : []);
      for (const word of words) session.record(word.id, true, 1200);
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
