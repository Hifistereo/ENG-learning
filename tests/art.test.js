import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { _setAvailable, hasArt, artUrl, artCount } from '../src/media/art.js';
import { WORDS } from '../src/data/words.js';
import { STORIES, MOODS } from '../src/data/stories.js';
import { PETS } from '../src/data/pets.js';
import { CHATTER, CHATTER_IDS } from '../src/data/chatter.js';

beforeEach(() => _setAvailable([]));

test('nothing is installed by default, so everything falls back to emoji', () => {
  assert.equal(artCount(), 0);
  assert.equal(hasArt('cat'), false);
  assert.equal(hasArt('scene:forest'), false);
});

test('manifest ids map to the folders the brief tells people to use', () => {
  assert.equal(artUrl('cat'), './assets/img/cat.webp');
  assert.equal(artUrl('cat__alt'), './assets/img/cat__alt.webp');
  assert.equal(artUrl('scene:forest'), './assets/img/scenes/forest.webp');
  assert.equal(artUrl('hero:duck'), './assets/img/heroes/duck.webp');
  assert.equal(artUrl('pet:dragon'), './assets/img/pets/dragon.webp');
  assert.equal(artUrl('char:alien'), './assets/img/characters/alien.webp');
});

test('an installed file is found, a missing one is not', () => {
  _setAvailable(['cat', 'scene:home', 'pet:owl']);
  assert.equal(hasArt('cat'), true);
  assert.equal(hasArt('dog'), false);
  assert.equal(hasArt('scene:home'), true);
  assert.equal(hasArt('scene:night'), false);
  assert.equal(hasArt('pet:owl'), true);
});

test('every id the brief promises resolves to a distinct path', () => {
  // Guards against the brief telling someone to save a file where the app
  // will never look for it.
  const chatterArt = [...new Set(
    Object.values(CHATTER).flat().map((c) => c.art).filter(Boolean),
  )];

  const ids = [
    ...WORDS.map((w) => w.id),
    ...WORDS.filter((w) => w.alt).map((w) => `${w.id}__alt`),
    ...Object.keys(MOODS).map((m) => `scene:${m}`),
    ...[...new Set(STORIES.map((s) => s.hero.id))].map((h) => `hero:${h}`),
    ...PETS.map((p) => `pet:${p.id}`),
    ...chatterArt,
    'char:alien',
  ];

  const paths = new Set();
  for (const id of ids) {
    const url = artUrl(id);
    assert.ok(url.startsWith('./assets/img/'), `${id} -> ${url}`);
    assert.ok(url.endsWith('.webp'), `${id} -> ${url}`);
    assert.equal(paths.has(url), false, `two ids collide on ${url}`);
    paths.add(url);
  }

  // The number the brief leads with, minus the 3 app icons which are
  // referenced directly rather than through the manifest.
  assert.equal(ids.length, 233, `the brief says 236 files including 3 icons; found ${ids.length} + 3`);
});

test('the phrases characters say never enter a quiz', () => {
  // The whole point of moving greetings out of the word list: they are heard
  // in context and never tested. If one leaked back into WORDS it would start
  // appearing as an answer choice, which is exactly what v0.3.0 removed.
  const wordIds = new Set(WORDS.map((w) => w.id));
  for (const id of CHATTER_IDS) {
    assert.equal(wordIds.has(id), false,
      `"${id}" is said by characters and must not also be a quizzed word`);
  }
});

test('every chatter picture points at a word picture slot, not a folder', () => {
  // These three were drawn before the rework and would have been wasted;
  // they are now the illustration beside the spoken line.
  for (const cue of Object.values(CHATTER).flat()) {
    if (!cue.art) continue;
    assert.equal(artUrl(cue.art), `./assets/img/${cue.art}.webp`);
  }
});

test('word ids are filename-safe, so the brief can name files directly', () => {
  for (const w of WORDS) {
    assert.equal(encodeURIComponent(w.id), w.id, `"${w.id}" would need escaping in a filename`);
  }
});
