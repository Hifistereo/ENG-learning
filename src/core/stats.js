// Statistics.
//
// Pure functions over a progress record. Two consumers: the parent page, and
// the achievement engine (every card's condition is written against the
// snapshot this module produces).

import { accuracy } from './srs.js';
import {
  isKnown, isLearning, isRetained, hasEvidence, knowledgeLevel,
  needsSupport, wordEvidence,
} from './knowledge.js';
import { DAY_MS, startOfDay, dayKey } from './time.js';
import { WORDS, getWord } from '../data/words.js';
import { UNITS } from '../data/units.js';

export { dayKey };

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

/** Knowledge breakdown per unit, for the parent page. */
export function unitBreakdown(progress, ageBand) {
  return UNITS.map((unit) => {
    const words = WORDS.filter((w) => w.unit === unit.id && w.level <= ageBand);
    const records = words.map((w) => progress.words[w.id]).filter(Boolean);
    return {
      ...unit,
      total: words.length,
      mastered: records.filter((r) => isKnown(r, ageBand)).length,
      learning: records.filter((r) => isLearning(r, ageBand)).length,
      untouched: words.length - records.length,
    };
  });
}

/**
 * Words worth mentioning to a parent: the ones being forgotten, or that only
 * come out with help. Sorted worst first.
 *
 * These are the words to use out loud at breakfast and in the bath. That is
 * the whole reason this list exists — the app cannot follow the child into
 * real situations, and real situations are where the words stick.
 */
export function weakWords(progress, ageBand, limit = 8) {
  return Object.values(progress.words || {})
    .filter(needsSupport)
    .map((rec) => ({ rec, word: getWord(rec.id) }))
    .filter((entry) => entry.word && entry.word.level <= ageBand)
    .sort((a, b) => (accuracy(a.rec) - accuracy(b.rec)) || (b.rec.wrong - a.rec.wrong))
    .slice(0, limit);
}

/** Every word with its evidence, for the parent's table. */
export function wordTable(progress, ageBand) {
  return WORDS
    .filter((w) => w.level <= ageBand)
    .map((word) => {
      const rec = progress.words[word.id] || null;
      const ev = wordEvidence(rec, ageBand);
      return {
        word,
        rec,
        ev,
        state: !rec ? 'new' : ev.known ? 'mastered' : 'learning',
        accuracy: ev.accuracy,
        lastSeen: rec?.lastSeen || 0,
      };
    });
}

/**
 * The measures that actually indicate learning, as opposed to activity.
 *
 * Deliberately separated from the time-and-sessions numbers: minutes played
 * says how willing a child was, not what they took away. Retention and
 * transfer are the headline; everything else on the parent page is context.
 */
export function learningMeasures(progress, ageBand) {
  const words = Object.values(progress.words || {});
  const eligible = WORDS.filter((w) => w.level <= ageBand).length;

  return {
    met: words.length,
    eligible,
    recognises: words.filter((r) => hasEvidence(r, 'recognise')).length,
    transfers: words.filter((r) => hasEvidence(r, 'transfer')).length,
    speaks: words.filter((r) => hasEvidence(r, 'produce')).length,
    nextDay: words.filter((r) => hasEvidence(r, 'delay1')).length,
    retained: words.filter(isRetained).length,
    known: words.filter((r) => isKnown(r, ageBand)).length,
    needingHelp: words.filter(needsSupport).length,
    // How many words sit at each level 0-5, for a distribution bar.
    levels: [0, 1, 2, 3, 4, 5].map((level) =>
      words.filter((r) => knowledgeLevel(r) === level).length),
  };
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
  const mastered = words.filter((r) => isKnown(r, ageBand));
  const totals = progress.totals || {};
  const week = windowTotals(sessions, 7, now);
  const measures = learningMeasures(progress, ageBand);

  const byUnit = {};
  for (const unit of unitBreakdown(progress, ageBand)) {
    byUnit[unit.id] = { mastered: unit.mastered, total: unit.total, done: unit.total > 0 && unit.mastered === unit.total };
  }

  return {
    now,
    ageBand,
    wordsSeen: words.length,
    wordsMastered: mastered.length,
    wordsLearning: words.filter((r) => isLearning(r, ageBand)).length,
    masteredIds: mastered.map((r) => r.id),

    // The evidence-based measures, available to achievement conditions so
    // cards can reward real retention rather than time served.
    wordsRecognised: measures.recognises,
    wordsTransferred: measures.transfers,
    wordsSpoken: measures.speaks,
    wordsRetained: measures.retained,
    wordsNextDay: measures.nextDay,

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
