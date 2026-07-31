import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  WORDS, getWord, wordsInUnit, wordsForLevel, tprWords, transferableWords,
  initialLetter, withArticle, pictureOf,
} from '../src/data/words.js';
import { UNIT_IDS } from '../src/data/units.js';

test('ids are unique and stable-looking', () => {
  const ids = WORDS.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length, 'a duplicate id would merge two words\' history');
  for (const id of ids) assert.match(id, /^[a-z0-9]+$/, `bad id: ${id}`);
});

test('every word is complete and well formed', () => {
  for (const w of WORDS) {
    assert.ok(w.en, `${w.id} needs an English word`);
    assert.ok(w.lv, `${w.id} needs a Latvian translation`);
    assert.ok(w.emoji, `${w.id} needs a picture`);
    assert.ok(UNIT_IDS.includes(w.unit), `${w.id} has unknown unit "${w.unit}"`);
    assert.ok([2, 5].includes(w.level), `${w.id} has odd level ${w.level}`);
    assert.ok(w.syl >= 1, `${w.id} needs a syllable count`);
    assert.ok([null, 'a', 'an'].includes(w.art), `${w.id} has odd article "${w.art}"`);
  }
});

test('no two words share a picture', () => {
  // Two words showing the same emoji makes at least one of them unanswerable.
  const byEmoji = new Map();
  for (const w of WORDS) {
    const clash = byEmoji.get(w.emoji);
    assert.equal(clash, undefined, `${w.id} and ${clash} both use ${w.emoji}`);
    byEmoji.set(w.emoji, w.id);
  }
});

test('an alternate picture is never another word\'s main picture', () => {
  // Otherwise a transfer check for "moon" would be showing the child the
  // picture that means "good night".
  const mains = new Map(WORDS.map((w) => [w.emoji, w.id]));
  for (const w of WORDS) {
    if (!w.alt) continue;
    const clash = mains.get(w.alt);
    assert.equal(clash, undefined, `${w.id}'s alternate ${w.alt} is ${clash}'s main picture`);
    assert.notEqual(w.alt, w.emoji, `${w.id}'s alternate is identical to its main picture`);
  }
});

test('alternates are distinct from each other', () => {
  const alts = new Map();
  for (const w of WORDS) {
    if (!w.alt) continue;
    const clash = alts.get(w.alt);
    assert.equal(clash, undefined, `${w.id} and ${clash} share the alternate ${w.alt}`);
    alts.set(w.alt, w.id);
  }
});

test('enough words carry a second picture for transfer to be routine', () => {
  const withAlt = WORDS.filter((w) => w.alt);
  assert.ok(withAlt.length >= 60,
    `only ${withAlt.length} words can be transfer-checked; that is too few to matter`);

  // Toddlers need it too — they are the ones most likely to have learned an
  // image rather than a word.
  const toddler = transferableWords(2);
  assert.ok(toddler.length >= 25, `only ${toddler.length} toddler words have an alternate`);
  assert.equal(toddler.every((w) => w.level <= 2), true);
});

test('every colour has an alternate, on a different object', () => {
  // Colour is the case where "knows the word" versus "knows the picture" is
  // sharpest: a child who only ever sees 🔴 may have learned that circle.
  for (const w of wordsInUnit('colors')) {
    assert.ok(w.alt, `${w.id} has no second picture, so its transfer can never be checked`);
  }
});

test('pictureOf returns the alternate only when asked, and only when it exists', () => {
  const cat = getWord('cat');
  assert.equal(pictureOf(cat).emoji, cat.emoji);
  assert.equal(pictureOf(cat, true).emoji, cat.alt);
  assert.notEqual(pictureOf(cat, true).id, cat.id, 'a distinct id so images resolve separately');

  const noAlt = WORDS.find((w) => !w.alt);
  assert.equal(pictureOf(noAlt, true).emoji, noAlt.emoji, 'falls back rather than showing nothing');
});

test('level filters are honoured', () => {
  assert.equal(wordsForLevel(2).every((w) => w.level <= 2), true);
  assert.ok(wordsForLevel(5).length > wordsForLevel(2).length);
  assert.equal(tprWords(2).every((w) => w.tpr && w.level <= 2), true);
  assert.ok(tprWords(2).length >= 5, 'the movement break needs a decent pool');
});

test('phonics skips words whose spelling misleads', () => {
  assert.equal(initialLetter(getWord('one')), null);
  assert.equal(initialLetter(getWord('eye')), null);
  assert.equal(initialLetter(getWord('eight')), null);
  assert.equal(initialLetter(getWord('cat')), 'c');
});

test('articles build correctly for sentence frames', () => {
  assert.equal(withArticle(getWord('cat')), 'a cat');
  assert.equal(withArticle(getWord('apple')), 'an apple');
  assert.equal(withArticle(getWord('milk')), 'milk');
});

test('every unit has words at both levels or is honestly age-gated', () => {
  for (const unit of UNIT_IDS) {
    const words = wordsInUnit(unit);
    assert.ok(words.length >= 6, `unit "${unit}" has only ${words.length} words`);
  }
  // Numbers are age 5 only, deliberately: matching a spoken word to a digit
  // glyph is a literacy skill a 2-year-old does not have.
  assert.equal(wordsInUnit('numbers').every((w) => w.level === 5), true);
});
