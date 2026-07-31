// Persistence. localStorage only — no server, no account, no network.
//
// Two things this module is responsible for beyond get/set:
//   1. Schema migration, so a released version can change the stored shape
//      without wiping a child's history.
//   2. Never throwing. A full quota, private-browsing mode, or hand-edited
//      JSON must degrade to "progress isn't saved this session", never to a
//      blank screen mid-activity.

import { SCHEMA_VERSION, APP_VERSION } from '../version.js';

const PREFIX = 'engl.v1.';

/** In-memory fallback: private mode, disabled storage, and Node under test. */
function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
}

function detectBackend() {
  try {
    const ls = globalThis.localStorage;
    const probe = `${PREFIX}__probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryBackend();
  }
}

let backend = detectBackend();
let persistent = backend === globalThis.localStorage;

/** True when writes actually survive a reload. The parent page warns if not. */
export const isPersistent = () => persistent;

/** Test seam: swap the backend (used by the unit tests). */
export function _setBackend(next) {
  backend = next || memoryBackend();
  persistent = false;
}

export function read(key, fallback = null) {
  try {
    const raw = backend.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('storage read failed', key, err);
    return fallback;
  }
}

export function write(key, value) {
  try {
    backend.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    // Almost always QuotaExceededError. Trim the biggest thing we hold — the
    // session log — and try once more before giving up.
    console.warn('storage write failed', key, err);
    if (trimLogs()) {
      try {
        backend.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch { /* fall through */ }
    }
    persistent = false;
    return false;
  }
}

export function remove(key) {
  try { backend.removeItem(PREFIX + key); } catch { /* ignore */ }
}

export function allKeys() {
  const keys = [];
  for (let i = 0; i < backend.length; i += 1) {
    const k = backend.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
  }
  return keys;
}

/** Halve every stored session log. Last-resort quota relief. */
function trimLogs() {
  let trimmed = false;
  for (const key of allKeys()) {
    if (!key.startsWith('progress.')) continue;
    const data = read(key);
    if (!data?.sessions?.length) continue;
    data.sessions = data.sessions.slice(-Math.ceil(data.sessions.length / 2));
    try {
      backend.setItem(PREFIX + key, JSON.stringify(data));
      trimmed = true;
    } catch { /* ignore */ }
  }
  return trimmed;
}

// --- Migrations ----------------------------------------------------------
// Keyed by the version being upgraded FROM. Each function receives the whole
// dump and returns it upgraded by exactly one version. Add one entry per
// schema change; never edit a released migration.
const MIGRATIONS = {
  /**
   * 1 -> 2 (v0.2.0): word records gain an evidence object.
   *
   * v0.1 measured mastery by counting correct taps on a same-picture question.
   * That evidence does not survive the new definition of knowing a word, so we
   * carry across only what the old data can honestly support: a word that had
   * been answered correctly at least once is credited with `recognise`, and
   * nothing else. Transfer and production were never tested, so they start
   * empty and the child earns them normally.
   *
   * Scheduling (box, streak, nextDue) carries over untouched — those answers
   * really did happen, and re-teaching known words from scratch would be a
   * worse error than starting the evidence ledger empty.
   */
  1: (dump) => {
    for (const [key, value] of Object.entries(dump.data || {})) {
      if (!key.startsWith('progress.') || !value?.words) continue;
      for (const rec of Object.values(value.words)) {
        if (rec.ev) continue;
        rec.help = rec.help || 0;
        rec.ev = {
          recognise: rec.correct > 0 ? (rec.lastSeen || rec.firstSeen || 0) : 0,
          transfer: 0,
          produce: 0,
          delay1: 0,
          delay7: 0,
        };
      }
    }
    return dump;
  },
};

export function migrate(dump) {
  let data = dump;
  let version = Number(data.schemaVersion) || 1;
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;                    // nothing to do for this hop
    data = step(data);
    version += 1;
  }
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

// --- Backup --------------------------------------------------------------

/** Everything we hold, as a plain object suitable for JSON download. */
export function exportAll() {
  const data = {};
  for (const key of allKeys()) data[key] = read(key);
  return {
    kind: 'eng-learning-backup',
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Replace stored state from a backup produced by exportAll().
 * @returns {{ok: boolean, error?: string}}
 */
export function importAll(dump) {
  if (!dump || dump.kind !== 'eng-learning-backup' || typeof dump.data !== 'object') {
    return { ok: false, error: 'format' };
  }
  const migrated = migrate({ ...dump, schemaVersion: dump.schemaVersion });
  for (const key of allKeys()) remove(key);
  for (const [key, value] of Object.entries(migrated.data)) write(key, value);
  return { ok: true };
}

/** Wipe everything this app owns. Other apps on the origin are untouched. */
export function clearAll() {
  for (const key of allKeys()) remove(key);
}

/**
 * Upgrade whatever is already in storage to the current schema.
 *
 * Runs once at module load. Without this, migrations would only ever apply to
 * imported backups and a returning child's existing progress would silently
 * stay on the old shape.
 */
export function migrateStored() {
  const meta = read('meta');
  const from = Number(meta?.schemaVersion) || (meta === null ? SCHEMA_VERSION : 1);

  if (meta === null) {
    // First run on this device: nothing to migrate, just set the floor.
    write('meta', { schemaVersion: SCHEMA_VERSION, createdAt: Date.now() });
    return { migrated: false, from: SCHEMA_VERSION };
  }
  if (from >= SCHEMA_VERSION) return { migrated: false, from };

  const data = {};
  for (const key of allKeys()) data[key] = read(key);

  const upgraded = migrate({ schemaVersion: from, data });
  for (const [key, value] of Object.entries(upgraded.data)) write(key, value);
  write('meta', { ...meta, schemaVersion: SCHEMA_VERSION, migratedAt: Date.now() });

  console.info(`[storage] migrated schema v${from} -> v${SCHEMA_VERSION}`);
  return { migrated: true, from };
}

migrateStored();
