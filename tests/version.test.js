import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { APP_VERSION, SCHEMA_VERSION } from '../src/version.js';

test('APP_VERSION is semver', () => {
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
});

test('the service worker cache version matches the app version', () => {
  // A service worker cannot import an ES module, so sw.js duplicates the
  // number. If they drift, a released update keeps serving the old cache and
  // nobody's tablet ever picks it up — silent, and very confusing to debug.
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const match = sw.match(/const VERSION = '([^']+)'/);
  assert.ok(match, 'sw.js must declare `const VERSION`');
  assert.equal(match[1], APP_VERSION,
    'bump VERSION in sw.js to match APP_VERSION in src/version.js');
});

test('package.json version matches too', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.version, APP_VERSION);
});

test('the changelog has an entry for the current version', () => {
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  assert.ok(changelog.includes(`## [${APP_VERSION}]`),
    `CHANGELOG.md needs a "## [${APP_VERSION}]" section`);
});

test('every file the service worker precaches actually exists', () => {
  // A typo here means that file silently drops out of the offline bundle and
  // the app breaks only once someone is actually offline.
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const list = sw.slice(sw.indexOf('const ASSETS'), sw.indexOf('self.addEventListener'));
  const paths = [...list.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]).filter(Boolean);

  assert.ok(paths.length > 30, `expected a full precache list, found ${paths.length}`);
  const missing = paths.filter((p) => {
    try {
      readFileSync(new URL(`../${p}`, import.meta.url));
      return false;
    } catch { return true; }
  });
  assert.deepEqual(missing, [], 'precached but missing from disk');
});

test('every source module is precached', () => {
  // The other direction: a new module that nobody added to sw.js would work
  // online and 503 offline.
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const root = new URL('../', import.meta.url);

  const walk = (dir) =>
    readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(`${dir}${entry.name}/`) : [`${dir}${entry.name}`]);
  const modules = walk('src/').filter((f) => f.endsWith('.js'));

  const missing = modules.filter((f) => !sw.includes(`'./${f}'`));
  assert.deepEqual(missing, [], 'source modules missing from the sw.js precache list');
});

test('SCHEMA_VERSION is a positive integer', () => {
  assert.ok(Number.isInteger(SCHEMA_VERSION) && SCHEMA_VERSION >= 1);
});
