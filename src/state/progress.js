// Per-child learning record: word history, session log, achievements, stickers.
//
// Reads are cached because an activity asks for a word's record on every
// render; writes go straight through so a closed tab never loses a session.

import { read, write, remove } from './storage.js';
import { newRecord, answer as srsAnswer, isMastered, isLearning } from '../core/srs.js';

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
 * Record one answer and reschedule the word.
 * @returns {object} the updated record
 */
export function recordAnswer(profileId, wordId, correct, ageBand, now = Date.now()) {
  const data = getProgress(profileId);
  const before = data.words[wordId] || newRecord(wordId);
  const after = srsAnswer(before, correct, { ageBand, now });
  data.words[wordId] = after;
  data.totals.items += 1;
  if (correct) data.totals.correct += 1;
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

export function masteredIds(profileId) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter(isMastered).map((r) => r.id);
}

export function learningIds(profileId) {
  const { words } = getProgress(profileId);
  return Object.values(words).filter(isLearning).map((r) => r.id);
}

export function masteredCount(profileId) {
  return masteredIds(profileId).length;
}

/** Drop the read cache — used after an import replaces everything. */
export function invalidateCache() {
  cache.clear();
}
