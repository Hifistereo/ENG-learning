// The session engine: turns a word queue into a paced sequence of rounds.
//
// Shape of a session is deliberately ritualised — same opening chant, same
// movement break in the middle, same celebration at the end, every time.
// Predictable structure is what lets a small child spend attention on the
// English instead of on working out what the app wants.
//
// Age 2 runs one activity type (listen and tap) plus chant and movement. That
// is not a reduced feature set, it is the design: variety costs a toddler more
// than it gives, whereas a five-year-old gets bored without it.

import { buildSession } from './selector.js';
import { initialLetter, tprWords } from '../data/words.js';
import { framesForWords } from '../data/phrases.js';

/** Rounds that ask a question and produce a right/wrong result. */
export const SCORED = new Set(['listenTap', 'phonics', 'memory', 'sentence']);

/** How many extra practice rounds a wrong answer may create. */
const MAX_REQUEUE = 4;

/**
 * Build the round list for a session.
 * @returns {Array<object>} rounds, each `{type, ...payload}`
 */
export function buildPlan(profile, progress, opts = {}) {
  const { now = Date.now(), size = 12, rng = Math.random } = opts;
  const { queue, newWords } = buildSession(profile, progress, { now, size, rng });
  const age = profile.ageBand;

  const known = queue.filter((s) => !s.isNew).map((s) => s.word);
  const rounds = [];

  // 1. Warm-up chant on words the child already has, so the session opens
  //    with guaranteed success. With no history yet, chant the new words —
  //    it doubles as their first exposure.
  const chantWords = (known.length >= 3 ? known : queue.map((s) => s.word))
    .filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i)
    .slice(0, 4);
  if (chantWords.length) rounds.push({ type: 'chant', words: chantWords });

  // 2. The main body.
  const body = age === 2 ? planToddler(queue) : planPreschool(queue, rng);

  // 3. Movement break, dropped in at the midpoint. TPR is where verbs stick,
  //    and it resets attention right when it starts to sag.
  const action = pickAction(profile, rng);
  const mid = Math.floor(body.length / 2);
  if (action) body.splice(mid, 0, { type: 'tpr', word: action });

  rounds.push(...body);
  rounds.push({ type: 'celebrate' });

  return { rounds, newWords, chantWords };
}

/** Toddlers: introduce, then listen-and-tap. Nothing else. */
function planToddler(queue) {
  const rounds = [];
  for (const slot of queue) {
    if (slot.intro) rounds.push({ type: 'intro', word: slot.word });
    rounds.push({ type: 'listenTap', word: slot.word, isNew: slot.isNew });
  }
  return rounds;
}

/**
 * Five-year-olds: listen-and-tap stays the backbone, with phonics, sentence
 * frames, a memory board and say-it woven through it.
 */
function planPreschool(queue, rng) {
  const rounds = [];
  const memoryPool = [];
  let sinceVariety = 0;

  for (const [i, slot] of queue.entries()) {
    if (slot.intro) {
      rounds.push({ type: 'intro', word: slot.word });
      rounds.push({ type: 'listenTap', word: slot.word, isNew: true });
      sinceVariety += 1;
      continue;
    }

    // Collect review words for one memory board, placed later in the session.
    if (!slot.isNew && memoryPool.length < 3 && i > 2 && rng() < 0.4) {
      memoryPool.push(slot.word);
      continue;
    }

    const choice = pickActivity(slot, sinceVariety, rng);
    rounds.push({ type: choice, word: slot.word, isNew: slot.isNew });
    sinceVariety = choice === 'listenTap' ? sinceVariety + 1 : 0;
  }

  if (memoryPool.length >= 2) {
    const at = Math.min(rounds.length, Math.floor(rounds.length * 0.6));
    rounds.splice(at, 0, { type: 'memory', words: memoryPool });
  }

  // Say-it goes last, on words the child has just practised: pronunciation
  // attempts go better after a run of successful recognition.
  const sayable = rounds.filter((r) => r.type === 'listenTap' && !r.isNew).slice(-3);
  for (const round of sayable) rounds.push({ type: 'sayIt', word: round.word });

  return rounds;
}

/** Which activity a given slot becomes. */
function pickActivity(slot, sinceVariety, rng) {
  const options = ['listenTap'];
  if (initialLetter(slot.word)) options.push('phonics');
  if (framesForWords([slot.word]).length) options.push('sentence');

  // Force a change of pace after three plain quiz rounds in a row.
  if (sinceVariety >= 3 && options.length > 1) {
    return options[1 + Math.floor(rng() * (options.length - 1))];
  }
  // Otherwise mostly listen-and-tap — it is the activity that teaches most.
  return rng() < 0.65 ? 'listenTap' : options[Math.floor(rng() * options.length)];
}

function pickAction(profile, rng) {
  const pool = tprWords(profile.ageBand);
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

// --- Runtime -------------------------------------------------------------

/**
 * A live session. The play screen advances it; it owns the results log and
 * hands back a summary for progress.commitSession().
 */
export function createSession(profile, progress, opts = {}) {
  const { rounds, newWords, chantWords } = buildPlan(profile, progress, opts);
  const startedAt = opts.now || Date.now();

  let index = 0;
  let requeued = 0;
  const results = [];        // {id, ok, ms}
  const activities = new Set();

  return {
    profile,
    newWords,
    chantWords,

    get total() { return rounds.length; },
    get position() { return index; },
    /** 0..1 for the progress bar. Celebration is not part of the journey. */
    get fraction() {
      const scored = rounds.filter((r) => r.type !== 'celebrate').length || 1;
      return Math.min(1, index / scored);
    },

    current() { return rounds[index] || null; },
    peek(offset = 1) { return rounds[index + offset] || null; },
    isFinished() { return index >= rounds.length; },

    advance() {
      index += 1;
      return rounds[index] || null;
    },

    /**
     * Log an answer. Wrong answers earn one extra practice round a little
     * later — the child always gets another chance to succeed with that word
     * before the session ends, which is the whole point of errorless design.
     */
    record(wordId, ok, ms = 0) {
      results.push({ id: wordId, ok: !!ok, ms });
      const round = rounds[index];
      if (round?.type) activities.add(round.type);

      // A memory board reports several words from one round, so resolve the
      // word from the id rather than assuming the round carries a single one.
      const word = round?.word?.id === wordId
        ? round.word
        : round?.words?.find((w) => w.id === wordId);

      if (!ok && word && requeued < MAX_REQUEUE) {
        const alreadyLater = rounds
          .slice(index + 1)
          .some((r) => r.word?.id === wordId && SCORED.has(r.type));
        if (!alreadyLater) {
          requeued += 1;
          const at = Math.min(rounds.length - 1, index + 3);
          rounds.splice(at, 0, { type: 'listenTap', word, retry: true });
        }
      }
    },

    /** Everything progress.commitSession() needs. */
    summary(now = Date.now()) {
      return {
        startedAt,
        durationMs: now - startedAt,
        items: results,
        activities: [...activities],
        newWordIds: newWords.map((w) => w.id),
      };
    },
  };
}
