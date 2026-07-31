// Per-child learning record: word history, session log, achievements, stickers.
//
// Reads are cached because an activity asks for a word's record on every
// render; writes go straight through so a closed tab never loses a session.

import { read, write, remove } from './storage.js';
import { newRecord, answer as srsAnswer } from '../core/srs.js';
import { isKnown, isLearning, isRetained, hasEvidence } from '../core/knowledge.js';

/** Keep the last N sessions. ~500 sessions is over a year of daily play and
 *  still well inside a sane localStorage budget. */
const MAX_SESSIONS = 500;

const cache = new Map();

const keyFor = (profileId) => `progress.${profileId}`;

function emptyProgress() {
  return {
    words: {},          // wordId -> srs record
    achievements: {},   // achievementId -> unlocked timestamp
    stickers: [],       // timestamps, one per completed session
    sessions: [],       // capped log, newest last
    unlockedUnits: [],  // units opened by earning the previous one
    totals: { sessions: 0, items: 0, correct: 0, playedMs: 0 },
  };
}

export function getProgress(profileId) {
  if (!profileId) return emptyProgress();
  if (cache.has(profileId)) return cache.get(profileId);
  const stored = read(keyFor(profileId), null);
  const data = { ...emptyProgress(), ...(stored || {}) };
  data.totals = { ...emptyProgress().totals, ...(data.totals || {}) };
  cache.set(profileId, data);
  return data;
}

function save(profileId, data) {
  cache.set(profileId, data);
  write(keyFor(profileId), data);
  return data;
}

export function getRecord(profileId, wordId) {
  return getProgress(profileId).words[wordId] || newRecord(wordId);
}

/**
 * Record one answer: reschedule the word and credit whatever the answer proves.
 *
 * @param {string} profileId
 * @param {string} wordId
 * @param {boolean} correct
 * @param {object} opts
 * @param {number} opts.ageBand
 * @param {string} opts.activity - which activity produced this, so the
 *   evidence model can decide what it demonstrates (see core/knowledge.js)
 * @param {boolean} [opts.aided] - a hint was shown, so it counts for nothing
 * @returns {object} the updated record
 */
export function recordAnswer(profileId, wordId, correct, opts = {}) {
  const { ageBand = 5, activity = 'listenTap', aided = false, now = Date.now() } = opts;
  const data = getProgress(profileId);
  const before = data.words[wordId] || newRecord(wordId);
  const after = srsAnswer(before, correct, { ageBand, now, activity, aided });
  data.words[wordId] = after;
  data.totals.items += 1;
  if (correct) data.totals.correct += 1;
  if (aided) data.totals.help = (data.totals.help || 0) + 1;
  save(profileId, data);
  return after;
}

/**
 * Append a finished session to the log.
 * @param {object} summary { startedAt, durationMs, items:[{id, ok, ms}], activities:[] }
 */
export function commitSession(profileId, summary) {
  const data = getProgress(profileId);
  const entry = {
    ts: summary.startedAt || Date.now(),
    ms: Math.max(0, Math.round(summary.durationMs || 0)),
    n: summary.items?.length || 0,
    ok: summary.items?.filter((i) => i.ok).length || 0,
    words: summary.items?.map((i) => i.id) || [],
    acts: summary.activities || [],
  };
  data.sessions = [...data.sessions, entry].slice(-MAX_SESSIONS);
  data.totals.sessions += 1;
  data.totals.playedMs += entry.ms;
  data.stickers = [...data.stickers, entry.ts].slice(-MAX_SESSIONS);
  // Remember where this visit happened so the next one picks somewhere else.
  // A child who plays daily should not open the same picture every day.
  if (summary.mood) data.lastMood = summary.mood;
  save(profileId, data);
  return entry;
}

/** @returns {string[]} ids that were newly unlocked (already-held ones are ignored) */
export function unlockAchievements(profileId, ids, now = Date.now()) {
  const data = getProgress(profileId);
  const fresh = ids.filter((id) => !data.achievements[id]);
  if (!fresh.length) return [];
  for (const id of fresh) data.achievements[id] = now;
  save(profileId, data);
  return fresh;
}

export function unlockUnit(profileId, unitId) {
  const data = getProgress(profileId);
  if (data.unlockedUnits.includes(unitId)) return data.unlockedUnits;
  data.unlockedUnits = [...data.unlockedUnits, unitId];
  save(profileId, data);
  return data.unlockedUnits;
}

export function resetProgress(profileId) {
  cache.delete(profileId);
  remove(keyFor(profileId));
}

// --- Derived counts (cheap, used all over the UI) ------------------------
//
// "Known" here means the evidence bar in core/knowledge.js — transfer plus
// delayed recall — not a box number. These counts are what the pet's level,
// the unit unlocks and the parent headline are all built on, so they must not
// drift back to counting taps.

export function knownIds(profileId, ageBand = 5) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter((r) => isKnown(r, ageBand)).map((r) => r.id);
}

export function learningIds(profileId, ageBand = 5) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter((r) => isLearning(r, ageBand)).map((r) => r.id);
}

export function knownCount(profileId, ageBand = 5) {
  return knownIds(profileId, ageBand).length;
}

/** Words still there a week after first meeting them. The headline measure. */
export function retainedCount(profileId) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter(isRetained).length;
}

/** Words recognised from a picture they were not taught with. */
export function transferCount(profileId) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter((r) => hasEvidence(r, 'transfer')).length;
}

/** Words the child has said out loud, confirmed by a grown-up. */
export function spokenCount(profileId) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter((r) => hasEvidence(r, 'produce')).length;
}

/** Drop the read cache — used after an import replaces everything. */
export function invalidateCache() {
  cache.clear();
}
