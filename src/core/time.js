// Shared time constants and helpers.
//
// Its own module so that srs.js and knowledge.js can both use them without
// importing each other — the two are deliberately separate concerns
// (scheduling vs. what an answer proves) and a cycle between them would be a
// sign that separation had broken down.

export const DAY_MS = 86_400_000;

/** Local midnight for a timestamp. Local, because "today" means the child's today. */
export const startOfDay = (ts) => new Date(ts).setHours(0, 0, 0, 0);

/** Local YYYY-MM-DD, used as a day key for streaks and daily charts. */
export function dayKey(ts) {
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Whole calendar days between two timestamps. */
export const daysBetween = (from, to) => (startOfDay(to) - startOfDay(from)) / DAY_MS;
