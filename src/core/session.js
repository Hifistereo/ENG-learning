// The session engine: one themed adventure, not a list of mini-games.
//
// The shape follows the four-phase arrangement from the research notes. The
// same handful of target words passes through every phase, each time in a
// different task:
//
//   1. MEET      the word is introduced, its meaning acted out
//   2. ORDER     someone wants it — understanding gets it for them
//   3. ACT       the child performs the verb, then has to retrieve it
//   4. STORY     the word is needed to move a story on, in a new context
//   5. TEACH     the child says it, correcting a character who got it wrong
//
// Interleaved through those are the spaced retrieval checks: immediately after
// introduction, again after two or three other words, once more at the end of
// the session, and — via the scheduler — the next day, then three days, then a
// week. Transfer checks (the same word, a picture the child has never seen)
// slot in wherever a word has earned one.
//
// Age 2 runs a shortened version: meet, order, act, story. No production and no
// phonics — a toddler is not asked to speak, and letters are not their task.

import { buildSession, transferCandidates, productionCandidates, currentUnit } from './selector.js';
import { buildStoryRound } from './storyBuilder.js';
import { initialLetter, tprWords } from '../data/words.js';
import { framesForWords } from '../data/phrases.js';
import { canOrder, sceneForUnit } from '../data/units.js';

/** Rounds that ask a question and produce a right/wrong result. */
export const SCORED = new Set([
  'listenTap', 'phonics', 'sentence', 'order', 'doAction', 'transfer', 'story', 'teach',
]);

/** How many extra practice rounds a wrong answer may create. */
const MAX_REQUEUE = 4;

/**
 * Quiet between one round ending and the next beginning, by age band.
 *
 * Part of the session's shape rather than the play screen's: a small child
 * needs noticeably longer than an adult to process what they just heard, and
 * a question arriving on the heel of the last answer is what made the app feel
 * relentless. The toddler gets the most room. See media/speech.js SETTLE_MS,
 * which holds a beat after every individual line on top of this.
 */
export const BETWEEN_ROUNDS_MS = { 2: 1000, 5: 700 };

/**
 * Build the round list for a session.
 * @returns {{rounds: object[], newWords: object[], chantWords: object[],
 *            targetWords: object[], mood: string}}
 */
export function buildPlan(profile, progress, opts = {}) {
  const { now = Date.now(), size = 12, rng = Math.random } = opts;
  const { queue, newWords, reviewWords } = buildSession(profile, progress, { now, size, rng });
  const age = profile.ageBand;

  const targetWords = dedupe([...newWords, ...reviewWords]);
  const pool = opts.pool || [];
  const rounds = [];

  // Where this visit happens. One place for the whole session: the child
  // arrives somewhere, everything occurs there, and they leave. `avoid` is the
  // last place they visited, so two sessions in a row do not open on the same
  // picture.
  const mood = sceneForUnit(currentUnit(profile, progress), {
    avoid: progress.lastMood || null,
    rng,
  });

  // Co-play card first for toddlers: the single biggest factor for a 2-year-old
  // is whether an adult is sitting with them, so we ask for one before
  // anything else happens.
  if (age === 2) rounds.push({ type: 'coplay' });

  // 1. Warm-up chant on words the child already has — the session opens on a
  //    guaranteed success.
  const known = queue.filter((s) => !s.isNew).map((s) => s.word);
  const chantWords = dedupe(known.length >= 3 ? known : queue.map((s) => s.word)).slice(0, 4);
  if (chantWords.length) rounds.push({ type: 'chant', words: chantWords });

  // 2. The body: every slot becomes a task, with new words always introduced
  //    before they are ever asked about.
  rounds.push(...planBody(queue, profile, rng));

  // 3. Movement break, around the midpoint, now with a retrieval attached.
  const action = pickAction(profile, rng);
  if (action) insertRound(rounds, { type: 'doAction', word: action }, 0.55);

  // 4. Transfer checks: same word, a picture never seen before. These are the
  //    rounds that tell us a word was learned rather than an image.
  for (const word of transferCandidates(profile, progress).slice(0, age === 2 ? 1 : 2)) {
    insertRound(rounds, { type: 'transfer', word }, 0.75);
  }

  // 5. The story. It used to sit at the very end, which meant the best part of
  //    the app arrived at round fifteen of eighteen and everything before it
  //    was the price of admission. It now lands around two thirds of the way
  //    through, so the visit builds to it and still has somewhere to go
  //    afterwards — and the words appear in it one more time, in a context
  //    that has nothing to do with how they were taught.
  const story = buildStoryRound(profile, progress, targetWords, { pool, rng });
  if (story) insertRound(rounds, story, 0.66);

  // 6. Production, age 5 only and only for words that already transfer.
  for (const word of productionCandidates(profile, progress).slice(0, 2)) {
    rounds.push({ type: 'teach', word });
  }

  // 7. End-of-session retrieval on the new words — the last spaced repetition
  //    before the next-day check does its job.
  for (const word of newWords) {
    rounds.push({ type: 'listenTap', word, isNew: true, finalCheck: true });
  }

  // 8. Leaving. With no progress bar, this is how a child learns the visit is
  //    over: the pet waves goodbye from the place they have been all session.
  rounds.push({ type: 'farewell' });
  rounds.push({ type: 'celebrate' });
  return { rounds, newWords, chantWords, targetWords, mood, story: story?.story || null };
}

/** The main body of tasks, built from the word queue. */
function planBody(queue, profile, rng) {
  const rounds = [];
  const age = profile.ageBand;
  let sinceVariety = 0;

  for (const slot of queue) {
    if (slot.intro) {
      rounds.push({ type: 'intro', word: slot.word });
      // Immediate retrieval, straight after meeting it. This is the first
      // spaced repetition and the cheapest one to get right.
      rounds.push({ type: 'listenTap', word: slot.word, isNew: true });
      sinceVariety = 0;
      continue;
    }

    const choice = pickActivity(slot, age, sinceVariety, rng);
    rounds.push({ type: choice, word: slot.word, isNew: slot.isNew });
    sinceVariety = choice === 'listenTap' ? sinceVariety + 1 : 0;
  }
  return rounds;
}

/**
 * Which task a given slot becomes.
 *
 * Toddlers get listen-and-tap and order-fulfilment only — two tasks, both
 * receptive, both short. Five-year-olds add phonics and sentence frames.
 */
function pickActivity(slot, age, sinceVariety, rng) {
  const options = ['listenTap'];
  // Only things a character could actually be handed: "Give me the apple" is
  // English, "Give me hello" is not.
  if (canOrder(slot.word)) options.push('order');
  if (age === 5) {
    if (initialLetter(slot.word)) options.push('phonics');
    if (framesForWords([slot.word]).length) options.push('sentence');
  }
  if (options.length === 1) return 'listenTap';

  // Force a change of pace after three plain quiz rounds in a row.
  if (sinceVariety >= 3) return options[1 + Math.floor(rng() * (options.length - 1))];
  // Otherwise mostly listen-and-tap and order — the two that teach most.
  return rng() < 0.5 ? 'listenTap' : options[Math.floor(rng() * options.length)];
}

function pickAction(profile, rng) {
  const pool = tprWords(profile.ageBand);
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

const dedupe = (words) => words.filter((w, i, arr) => arr.findIndex((x) => x.id === w.id) === i);

/**
 * Insert a round near a target position without breaking an intro pair.
 *
 * A new word is introduced and then retrieved straight away — that immediate
 * retrieval is the first and cheapest spaced repetition in the whole design.
 * Dropping a movement round or a transfer check between the two would put a
 * minute of unrelated activity in the gap and quietly turn the cheapest
 * repetition into the hardest one. So we slide past any intro to the next
 * safe boundary.
 *
 * @param {object[]} rounds - mutated in place
 * @param {object} round
 * @param {number} fraction - roughly where it belongs, 0..1
 */
export function insertRound(rounds, round, fraction) {
  const target = Math.max(1, Math.min(rounds.length, Math.floor(rounds.length * fraction)));

  // Walk forward to the first index whose predecessor is not an introduction.
  let at = target;
  while (at < rounds.length && rounds[at - 1]?.type === 'intro') at += 1;
  // If that ran off the end, walk back instead.
  if (at >= rounds.length) {
    at = target;
    while (at > 1 && rounds[at - 1]?.type === 'intro') at -= 1;
  }

  rounds.splice(at, 0, round);
  return at;
}

// --- Runtime -------------------------------------------------------------

/**
 * A live session. The play screen advances it; it owns the results log and
 * hands back a summary for progress.commitSession().
 */
export function createSession(profile, progress, opts = {}) {
  const plan = buildPlan(profile, progress, opts);
  const { rounds, newWords, chantWords, targetWords, story, mood } = plan;
  const startedAt = opts.now || Date.now();

  let index = 0;
  let requeued = 0;
  const results = [];        // {id, ok, ms}
  const activities = new Set();

  return {
    profile,
    newWords,
    chantWords,
    targetWords,
    story,
    mood,

    get total() { return rounds.length; },
    get position() { return index; },

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
     * before the session ends.
     */
    record(wordId, ok, ms = 0) {
      results.push({ id: wordId, ok: !!ok, ms });
      const round = rounds[index];
      if (round?.type) activities.add(round.type);

      const word = round?.word?.id === wordId
        ? round.word
        : round?.words?.find((w) => w.id === wordId)
          || round?.scenes?.find((s) => s.word.id === wordId)?.word;

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
        storyId: story?.id || null,
        mood,
      };
    },
  };
}
