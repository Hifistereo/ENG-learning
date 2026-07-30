import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { _setBackend, read, write, remove, allKeys, exportAll, importAll, clearAll }
  from '../src/state/storage.js';
import { SCHEMA_VERSION } from '../src/version.js';

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
