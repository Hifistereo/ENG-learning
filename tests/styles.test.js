// Guards on the stylesheets.
//
// These exist because of a real bug: ui/sceneStage.js sized every answer
// picture with `var(--prop-size)`, and that custom property was never defined
// anywhere. CSS does not warn about that — it just drops the declaration — so
// the emoji quietly rendered at inherited body text size, tiny and unreadable,
// through a whole release. Nothing in the test suite could see it, because
// nothing in the test suite reads CSS.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = (name) => new URL(`../${name}/`, import.meta.url);

const read = (folder, file) => readFileSync(new URL(file, dir(folder)), 'utf8');

const cssFiles = readdirSync(dir('styles')).filter((f) => f.endsWith('.css'));
const css = cssFiles.map((f) => read('styles', f)).join('\n');

// The KidMindPath design system declares every --kmp-* token that styles/
// now reads. It is a synced copy of Hifistereo.github.io/shared/ rather than
// this app's own CSS, so it counts towards "defined" but is not itself
// checked here — the hub owns it.
//
// This is load-bearing for the same reason the whole file is: if a sync ever
// drops a token that styles/tokens.css points at, CSS silently discards the
// declaration and the app renders with no colour, no spacing, no fonts. That
// failure is invisible until someone looks at a screen.
const sharedCss = readdirSync(dir('shared'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => read('shared', f))
  .join('\n');

/** Every .js file under src/, recursively. */
function sourceFiles(folder = 'src') {
  const out = [];
  for (const entry of readdirSync(dir(folder), { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...sourceFiles(`${folder}/${entry.name}`));
    else if (entry.name.endsWith('.js')) out.push(read(folder, entry.name));
  }
  return out;
}

/** Custom properties something actually declares a value for. */
function declaredProperties(text) {
  const names = new Set();
  // `--name:` in a stylesheet, and setProperty('--name', …) from JS.
  for (const m of text.matchAll(/(^|[;{\s])(--[\w-]+)\s*:/g)) names.add(m[2]);
  for (const m of text.matchAll(/setProperty\(\s*['"](--[\w-]+)['"]/g)) names.add(m[1]);
  return names;
}

/** Custom properties something reads, ignoring those given a fallback. */
function usedProperties(text) {
  const names = new Set();
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
    if (m[2] === ')') names.add(m[1]);      // no fallback: it must exist
  }
  return names;
}

test('every custom property the styles read is defined somewhere', () => {
  const js = sourceFiles().join('\n');
  const defined = new Set([
    ...declaredProperties(css),
    ...declaredProperties(sharedCss),
    ...declaredProperties(js),
  ]);

  const missing = [...usedProperties(css)].filter((name) => !defined.has(name));
  assert.deepEqual(missing, [],
    `used but never defined: ${missing.join(', ')}`);
});

test('every custom property the app sets from JS is defined too', () => {
  // Inline styles are where this bites hardest: `style="font-size: var(--x)"`
  // with no --x means the element falls back to inherited text size, which for
  // a picture a pre-literate child has to read is the difference between the
  // app working and not.
  const js = sourceFiles().join('\n');
  const defined = new Set([
    ...declaredProperties(css),
    ...declaredProperties(sharedCss),
    ...declaredProperties(js),
  ]);

  const missing = [...usedProperties(js)].filter((name) => !defined.has(name));
  assert.deepEqual(missing, [],
    `used from JS but never defined in styles/: ${missing.join(', ')}`);
});

test('answer pictures are sized large enough to read across', () => {
  // The floor, not the ideal. A picture is the entire question for a child who
  // cannot read, so it must never collapse to text size again.
  const matches = [...css.matchAll(/--prop-size:\s*clamp\(\s*([\d.]+)rem/g)];
  assert.ok(matches.length >= 2, 'expected a --prop-size per age band');
  for (const m of matches) {
    assert.ok(Number(m[1]) >= 4,
      `--prop-size floor of ${m[1]}rem is too small to see at arm's length`);
  }
});

test('the toddler gets bigger pictures than the five-year-old', () => {
  // Two answers instead of four means each can afford more room, and the
  // younger child needs it more.
  const floor = (band) => {
    const block = css.match(new RegExp(`body\\[data-age="${band}"\\][^}]+}`, 's'))?.[0] || '';
    return Number(block.match(/--prop-size:\s*clamp\(\s*([\d.]+)rem/)?.[1] || 0);
  };
  assert.ok(floor(2) > floor(5), `age 2 (${floor(2)}rem) must exceed age 5 (${floor(5)}rem)`);
});
