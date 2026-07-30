// Statistics.
//
// Pure functions over a progress record. Two consumers: the parent page, and
// the achievement engine (every card's condition is written against the
// snapshot this module produces).

import { isMastered, isLearning, isLeech, accuracy, DAY_MS } from './srs.js';
import { WORDS, getWord } from '../data/words.js';
import { UNITS } from '../data/units.js';

const startOfDay = (ts) => new Date(ts).setHours(0, 0, 0, 0);

/** Local YYYY-MM-DD. Local, not UTC — "today" must mean the child's today. */
export function dayKey(ts) {
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Consecutive days up to and including today on which the child played.
 *
 * Yesterday still counts as an unbroken streak so that a session late one
 * evening and another the next morning is not punished by the clock. A missed
 * day simply stops the count — there is no "streak lost" state anywhere.
 */
export function currentStreak(sessions, now = Date.now()) {
  if (!sessions?.length) return 0;
  const days = new Set(sessions.map((s) => dayKey(s.ts)));
  const today = startOfDay(now);

  if (!days.has(dayKey(today)) && !days.has(dayKey(today - DAY_MS))) return 0;

  let streak = 0;
  let cursor = days.has(dayKey(today)) ? today : today - DAY_MS;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/** The longest run of consecutive playing days ever achieved. */
export function bestStreak(sessions) {
  if (!sessions?.length) return 0;
  const days = [...new Set(sessions.map((s) => startOfDay(s.ts)))].sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    run = days[i] - days[i - 1] === DAY_MS ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

/** Per-day totals for the last `days` days, oldest first — drives the chart. */
export function dailyActivity(sessions, days = 14, now = Date.now()) {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const ts = startOfDay(now) - i * DAY_MS;
    const key = dayKey(ts);
    const onDay = (sessions || []).filter((s) => dayKey(s.ts) === key);
    const items = onDay.reduce((sum, s) => sum + (s.n || 0), 0);
    const correct = onDay.reduce((sum, s) => sum + (s.ok || 0), 0);
    out.push({
      key,
      ts,
      sessions: onDay.length,
      minutes: onDay.reduce((sum, s) => sum + (s.ms || 0), 0) / 60000,
      items,
      correct,
      accuracy: items ? correct / items : null,
    });
  }
  return out;
}

/** Totals over a trailing window, e.g. the last 7 days. */
export function windowTotals(sessions, days = 7, now = Date.now()) {
  const since = startOfDay(now) - (days - 1) * DAY_MS;
  const inWindow = (sessions || []).filter((s) => s.ts >= since);
  const items = inWindow.reduce((sum, s) => sum + (s.n || 0), 0);
  const correct = inWindow.reduce((sum, s) => sum + (s.ok || 0), 0);
  return {
    sessions: inWindow.length,
    minutes: inWindow.reduce((sum, s) => sum + (s.ms || 0), 0) / 60000,
    items,
    correct,
    accuracy: items ? correct / items : null,
  };
}

/** Mastery breakdown per unit, for the parent page. */
export function unitBreakdown(progress, ageBand) {
  return UNITS.map((unit) => {
    const words = WORDS.filter((w) => w.unit === unit.id && w.level <= ageBand);
    const records = words.map((w) => progress.words[w.id]).filter(Boolean);
    return {
      ...unit,
      total: words.length,
      mastered: records.filter(isMastered).length,
      learning: records.filter(isLearning).length,
      untouched: words.length - records.length,
    };
  });
}

/**
 * Words worth mentioning to a parent: the ones being forgotten repeatedly.
 * Sorted worst first.
 */
export function weakWords(progress, ageBand, limit = 8) {
  return Object.values(progress.words || {})
    .filter((rec) => isLeech(rec) || (rec.seen >= 3 && accuracy(rec) < 0.6))
    .map((rec) => ({ rec, word: getWord(rec.id) }))
    .filter((entry) => entry.word && entry.word.level <= ageBand)
    .sort((a, b) => (accuracy(a.rec) - accuracy(b.rec)) || (b.rec.wrong - a.rec.wrong))
    .slice(0, limit);
}

/** Every word with its record, for the parent's sortable table. */
export function wordTable(progress, ageBand) {
  return WORDS
    .filter((w) => w.level <= ageBand)
    .map((word) => {
      const rec = progress.words[word.id] || null;
      return {
        word,
        rec,
        state: !rec ? 'new' : isMastered(rec) ? 'mastered' : 'learning',
        accuracy: rec ? accuracy(rec) : null,
        lastSeen: rec?.lastSeen || 0,
      };
    });
}

/**
 * The snapshot every achievement condition is evaluated against.
 *
 * Keep this shape additive: an achievement written today must keep working
 * when new fields appear, and new cards must be able to read old history.
 */
export function snapshot(progress, profile, now = Date.now()) {
  const words = Object.values(progress.words || {});
  const sessions = progress.sessions || [];
  const ageBand = profile?.ageBand ?? 5;
  const mastered = words.filter(isMastered);
  const totals = progress.totals || {};
  const week = windowTotals(sessions, 7, now);

  const byUnit = {};
  for (const unit of unitBreakdown(progress, ageBand)) {
    byUnit[unit.id] = { mastered: unit.mastered, total: unit.total, done: unit.total > 0 && unit.mastered === unit.total };
  }

  return {
    now,
    ageBand,
    wordsSeen: words.length,
    wordsMastered: mastered.length,
    wordsLearning: words.filter(isLearning).length,
    masteredIds: mastered.map((r) => r.id),

    sessions: sessions.length,
    totalItems: totals.items || 0,
    totalCorrect: totals.correct || 0,
    totalMinutes: (totals.playedMs || 0) / 60000,
    accuracy: totals.items ? totals.correct / totals.items : null,

    streakDays: currentStreak(sessions, now),
    bestStreakDays: bestStreak(sessions),
    daysPlayed: new Set(sessions.map((s) => dayKey(s.ts))).size,

    weekSessions: week.sessions,
    weekMinutes: week.minutes,

    units: byUnit,
    unitsComplete: Object.values(byUnit).filter((u) => u.done).length,

    // Flags set by the session that just finished, so cards can react to
    // one-off events ("first perfect round", "first recording").
    lastSession: progress.sessions?.at(-1) || null,
    perfectSessions: sessions.filter((s) => s.n > 0 && s.ok === s.n).length,
    activitiesUsed: [...new Set(sessions.flatMap((s) => s.acts || []))],
  };
}
