// Turning a story shape into a playable round.
//
// Stories declare which UNIT each scene's slot needs; this fills those slots
// with words the child is actually working on this session. The point is that
// the adventure drills the same vocabulary as everything else rather than
// running its own private word list — one theme, several tasks, which is the
// arrangement the research notes recommend over four unconnected games.
//
// Pure, so the whole thing can be tested without a browser.

import { pickStory, getStory } from '../data/stories.js';
import { wordsInUnit, getWord } from '../data/words.js';
import { pickDistractors } from './selector.js';

/** Pictures offered per scene, by age band. Fewer than a quiz: the sentence
 *  is already doing work, so the choice should not also be hard. */
export const STORY_CHOICES = { 2: 2, 5: 3 };

/**
 * Build a story round.
 *
 * @param {object} profile
 * @param {object} progress
 * @param {object[]} targetWords - what this session is teaching
 * @param {object} [opts]
 * @param {string} [opts.storyId] - force a specific story (tests, replays)
 * @param {object[]} [opts.pool] - words available for distractors
 * @param {Function} [opts.rng]
 * @returns {{type:'story', story:object, scenes:object[]}|null}
 */
export function buildStoryRound(profile, progress, targetWords, opts = {}) {
  const { storyId = null, pool = [], rng = Math.random } = opts;

  const units = [...new Set(targetWords.map((w) => w.unit))];
  const recent = (progress.recentStories || []);
  const story = storyId ? getStory(storyId) : pickStory(units, recent, rng);
  if (!story) return null;

  const used = new Set();
  const scenes = [];

  for (const scene of story.scenes) {
    const word = pickSlotWord(scene, targetWords, profile, used, rng);
    if (!word) continue;                 // no suitable word: drop the scene
    used.add(word.id);

    const choices = STORY_CHOICES[profile.ageBand] ?? STORY_CHOICES[5];
    const distractors = pickDistractors(word, pool.length ? pool : allFor(profile), choices - 1, {
      ageBand: profile.ageBand,
      progress,
      rng,
    });

    scenes.push({
      ...scene,
      word,
      options: shuffle([word, ...distractors], rng),
    });
  }

  // A one-scene story is not a story. Better to skip it than to ship a
  // narrative that is really just one more quiz question with a background.
  if (scenes.length < 2) return null;

  return { type: 'story', story, scenes };
}

/**
 * Choose the word for one scene's slot.
 *
 * Two rules, in this order:
 *
 *   1. If the scene lists `slotWords`, that is a HARD constraint. "The cat is
 *      thirsty. Find the ___." can be answered with milk or water, never with
 *      bread. A story that contradicts itself teaches a child that the words
 *      do not really mean anything, which is worse than no story at all.
 *   2. Within whatever is allowed, prefer a word this session is already
 *      teaching. That is what keeps the adventure tied to the rest of the
 *      session instead of running its own private word list.
 */
function pickSlotWord(scene, targetWords, profile, used, rng) {
  const allowed = scene.slotWords ? new Set(scene.slotWords) : null;
  const eligible = (w) =>
    w.level <= profile.ageBand
    && !used.has(w.id)
    && (allowed ? allowed.has(w.id) : w.unit === scene.slotUnit);

  const targeted = targetWords.filter(eligible);
  if (targeted.length) return targeted[Math.floor(rng() * targeted.length)];

  // Fall back to the wider pool — the constraint still applies.
  const pool = allowed
    ? [...allowed].map(getWord).filter((w) => w && eligible(w))
    : wordsInUnit(scene.slotUnit).filter(eligible);

  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}

const allFor = (profile) => wordsInUnit('animals').filter((w) => w.level <= profile.ageBand);

function shuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Remember which stories were played, so the next one is usually different. */
export function rememberStory(progress, storyId, keep = 3) {
  const recent = [...(progress.recentStories || []), storyId].slice(-keep);
  return recent;
}
