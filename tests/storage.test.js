import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { _setBackend, read, write, remove, allKeys, exportAll, importAll, clearAll }
  from '../src/state/storage.js';
import { SCHEMA_VERSION } from '../src/version.js';
import { isKnown, knowledgeLevel } from '../src/core/knowledge.js';

/** A localStorage-shaped fake we can make fail on demand. */
function fakeStorage({ quotaAfter = Infinity } = {}) {
  const map = new Map();
  let writes = 0;
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem(k, v) {
      writes += 1;
      if (writes > quotaAfter) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      map.set(k, v);
    },
    removeItem: (k) => map.delete(k),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
}

beforeEach(() => _setBackend(fakeStorage()));

test('write then read round-trips structured data', () => {
  write('thing', { a: 1, nested: { b: [1, 2, 3] } });
  assert.deepEqual(read('thing'), { a: 1, nested: { b: [1, 2, 3] } });
});

test('reading a missing key returns the fallback', () => {
  assert.equal(read('nope', 'fallback'), 'fallback');
  assert.equal(read('nope'), null);
});

test('corrupt JSON returns the fallback instead of throwing', () => {
  const backend = fakeStorage();
  backend.setItem('engl.v1.broken', '{not json');
  _setBackend(backend);
  assert.deepEqual(read('broken', { safe: true }), { safe: true });
});

test('keys are namespaced so we never touch another app on the origin', () => {
  const backend = fakeStorage();
  backend.setItem('someone-elses-key', 'do not touch');
  _setBackend(backend);
  write('mine', 1);
  assert.deepEqual(allKeys(), ['mine']);
  clearAll();
  assert.equal(backend.getItem('someone-elses-key'), 'do not touch');
});

test('a failed write reports false rather than throwing mid-activity', () => {
  _setBackend(fakeStorage({ quotaAfter: 0 }));
  assert.equal(write('anything', { big: true }), false);
});

test('hitting quota trims session logs and retries', () => {
  const backend = fakeStorage();
  _setBackend(backend);
  const sessions = Array.from({ length: 10 }, (_, i) => ({ ts: i }));
  write('progress.kid', { sessions });

  // Now fail the very next write, forcing the trim-and-retry path.
  let failNext = true;
  const original = backend.setItem.bind(backend);
  backend.setItem = (k, v) => {
    if (failNext && k === 'engl.v1.other') {
      failNext = false;
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
    original(k, v);
  };

  assert.equal(write('other', { x: 1 }), true, 'retry should succeed after trimming');
  assert.equal(read('progress.kid').sessions.length, 5, 'log halved to make room');
  assert.deepEqual(read('other'), { x: 1 });
});

test('export captures everything and stamps the schema version', () => {
  write('profiles', [{ id: 'a' }]);
  write('progress.a', { words: { cat: { box: 3 } } });
  const dump = exportAll();
  assert.equal(dump.kind, 'eng-learning-backup');
  assert.equal(dump.schemaVersion, SCHEMA_VERSION);
  assert.deepEqual(dump.data.profiles, [{ id: 'a' }]);
  assert.equal(dump.data['progress.a'].words.cat.box, 3);
});

test('import replaces state and round-trips an export exactly', () => {
  write('profiles', [{ id: 'a', name: 'Anna' }]);
  write('progress.a', { words: { cat: { box: 3, streak: 2 } }, sessions: [{ ts: 1 }] });
  const dump = exportAll();

  // Wipe and restore into a clean backend.
  _setBackend(fakeStorage());
  write('profiles', [{ id: 'stale', name: 'Old' }]);
  const result = importAll(dump);

  assert.equal(result.ok, true);
  assert.deepEqual(read('profiles'), [{ id: 'a', name: 'Anna' }], 'stale data is gone');
  assert.equal(read('progress.a').words.cat.streak, 2);
});

test('import rejects anything that is not one of our backups', () => {
  assert.deepEqual(importAll(null), { ok: false, error: 'format' });
  assert.deepEqual(importAll({ data: {} }), { ok: false, error: 'format' });
  assert.deepEqual(importAll({ kind: 'something-else', data: {} }), { ok: false, error: 'format' });

  write('profiles', [{ id: 'safe' }]);
  importAll({ kind: 'nope', data: { profiles: [] } });
  assert.deepEqual(read('profiles'), [{ id: 'safe' }], 'a rejected import must not wipe data');
});

test('remove deletes a single key', () => {
  write('a', 1);
  write('b', 2);
  remove('a');
  assert.equal(read('a'), null);
  assert.equal(read('b'), 2);
});

// --- Schema migration v1 -> v2 -------------------------------------------

test('v0.1 progress survives the move to evidence-based knowledge', () => {
  // v0.1 measured mastery by counting correct taps on a same-picture question.
  // That evidence does not survive the new definition of knowing a word, so
  // the migration carries across only what the old data honestly supports.
  const legacy = {
    kind: 'eng-learning-backup',
    schemaVersion: 1,
    appVersion: '0.1.0',
    data: {
      profiles: [{ id: 'kid', name: 'Anna', ageBand: 5 }],
      'progress.kid': {
        words: {
          cat: { id: 'cat', box: 5, streak: 4, seen: 9, correct: 8, wrong: 1,
            lastSeen: 1000, nextDue: 2000, firstSeen: 500 },
          dog: { id: 'dog', box: 1, streak: 0, seen: 3, correct: 0, wrong: 3,
            lastSeen: 900, nextDue: 1500, firstSeen: 400 },
        },
        sessions: [{ ts: 1000, ms: 300000, n: 9, ok: 8 }],
        achievements: { first_session: 900 },
        totals: { sessions: 1, items: 9, correct: 8, playedMs: 300000 },
      },
    },
  };

  assert.equal(importAll(legacy).ok, true);
  const words = read('progress.kid').words;

  // A word answered correctly is credited with recognition, and nothing else.
  assert.ok(words.cat.ev.recognise > 0, 'a correct answer really did happen');
  assert.equal(words.cat.ev.transfer, 0, 'transfer was never tested in v0.1');
  assert.equal(words.cat.ev.produce, 0, 'production was never tested in v0.1');
  assert.equal(words.cat.ev.delay1, 0);
  assert.equal(words.cat.ev.delay7, 0);

  // A word never answered correctly gets nothing at all.
  assert.equal(words.dog.ev.recognise, 0);

  // Scheduling carries over untouched: those answers did happen, and
  // re-teaching known words from scratch would be the worse error.
  assert.equal(words.cat.box, 5);
  assert.equal(words.cat.nextDue, 2000);
  assert.equal(words.cat.help, 0, 'the new hint counter is initialised');

  // Everything else is left alone.
  assert.deepEqual(read('progress.kid').achievements, { first_session: 900 });
  assert.equal(read('profiles')[0].name, 'Anna');
});

test('a migrated word is not treated as known', () => {
  // The whole point: five correct taps under the old rules must not silently
  // become "mastered" under the new ones.
  const legacy = {
    kind: 'eng-learning-backup', schemaVersion: 1, appVersion: '0.1.0',
    data: { 'progress.kid': { words: { cat: { id: 'cat', box: 5, streak: 5, seen: 5, correct: 5, wrong: 0, lastSeen: 1, firstSeen: 1 } } } },
  };
  importAll(legacy);
  const rec = read('progress.kid').words.cat;
  assert.equal(isKnown(rec, 5), false, 'it still has to earn transfer and delayed recall');
  assert.equal(knowledgeLevel(rec), 2, 'recognises it, nothing more');
});

test('migration is idempotent', () => {
  const legacy = {
    kind: 'eng-learning-backup', schemaVersion: 1, appVersion: '0.1.0',
    data: { 'progress.kid': { words: { cat: { id: 'cat', box: 3, seen: 4, correct: 3, wrong: 1, lastSeen: 77, firstSeen: 10 } } } },
  };
  importAll(legacy);
  const once = read('progress.kid').words.cat.ev.recognise;
  importAll(exportAll());          // re-import an already-migrated dump
  assert.equal(read('progress.kid').words.cat.ev.recognise, once,
    'running it again must not move the evidence timestamps');
});
