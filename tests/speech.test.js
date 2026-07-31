// Guards on how the app talks.
//
// Two of these come from real bugs. Speech was set at a rate nobody had
// checked against how adults actually talk to small children, and several
// activities fired a line without awaiting it — `say()` cancels whatever is
// speaking, so the next round chopped the previous answer off, almost always
// on the noun. Neither was visible to any test, because nothing here listened.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { defaultSettings, RECOMMENDED_RATE, RATE_RANGE } from '../src/state/profiles.js';
import { BETWEEN_ROUNDS_MS } from '../src/core/session.js';
import { CHATTER } from '../src/data/chatter.js';

const activityDir = new URL('../src/activities/', import.meta.url);
const activities = readdirSync(activityDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => [f, readFileSync(new URL(f, activityDir), 'utf8')]);

test('the spoken rate sits in the band the research points at', () => {
  // Adults talking to a small child run about half the pace of adults talking
  // to each other, and young-learner listening studies land around 95-125 wpm.
  // Web Speech rate is relative to a voice that is normally 150-180 wpm, so
  // that band is roughly 0.55-0.75. Below ~0.4 synthesis stops sounding like
  // speech at all.
  for (const band of [2, 5]) {
    const rate = RECOMMENDED_RATE[band];
    assert.ok(rate >= 0.5 && rate <= 0.75,
      `age ${band} speaks at ${rate}, outside the child-directed band`);
    assert.equal(defaultSettings(band).rate, rate);
  }
});

test('the toddler is never spoken to faster than the five-year-old', () => {
  assert.ok(RECOMMENDED_RATE[2] < RECOMMENDED_RATE[5],
    'fewer words and more time on each is the point of the younger track');
});

test('a parent can go slower than the recommendation, and faster', () => {
  assert.ok(RATE_RANGE.min < RECOMMENDED_RATE[2], 'no room left to slow it down');
  assert.ok(RATE_RANGE.max > RECOMMENDED_RATE[5], 'no room left to speed it up');
  assert.ok(RATE_RANGE.min >= 0.4, 'below 0.4 most engines stop slowing or turn to mush');
});

test('activities never fire speech they do not wait for', () => {
  // `say()` cancels whatever is currently speaking. So a line started and not
  // awaited is a line the next round will cut off part-way through — and the
  // part that gets lost is the end, which is where the word is.
  //
  // Speech inside a handler (`() => ctx.say(...)`) is fine: the child asked
  // for it. Only statement-position calls are the bug, and the single
  // deliberate one is marked `void` at its call site.
  const offenders = [];
  for (const [name, src] of activities) {
    src.split('\n').forEach((line, i) => {
      if (/^\s*ctx\.(say|sayText)\(/.test(line)) offenders.push(`${name}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [],
    `speech started but never awaited: ${offenders.join(', ')}`);
});

test('rounds leave a gap for the child to catch up', () => {
  // Children need noticeably longer than adults to process what they heard,
  // and the toddler needs the most.
  assert.ok(BETWEEN_ROUNDS_MS[5] >= 500, 'too little quiet between questions');
  assert.ok(BETWEEN_ROUNDS_MS[2] > BETWEEN_ROUNDS_MS[5],
    'the younger child gets more time, not less');
});

test('what a character says stays short', () => {
  // Every cue is heard hundreds of times, and the activity usually appends the
  // word being taught on top. Padding buries the phrase it exists to teach.
  for (const [moment, cues] of Object.entries(CHATTER)) {
    for (const cue of cues) {
      const words = cue.en.trim().split(/\s+/).length;
      assert.ok(words <= 4,
        `${moment} cue "${cue.en}" is ${words} words — say less around the lesson`);
    }
  }
});
