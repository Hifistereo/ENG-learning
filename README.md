# Mācāmies angliski! 🐲

Angļu valodas mācību spēle latviešu bērniem. Bez reklāmām, bez konta, bez interneta.

An English-learning app for Latvian-speaking children, built around one engine
with two age profiles: a pre-literate toddler track (2–4) and a preschool track
(5–7). It runs as a static site on GitHub Pages, works fully offline, and keeps
every scrap of data on the device.

**Live:** https://hifistereo.github.io/ENG-learning/

---

## What it does

| | Age 2–4 | Age 5–7 |
|---|---|---|
| Session length | ~5 min, 8 items | ~12 min, 18 items |
| New words per session | 1–3 | 2–5 |
| Answer choices | 2 | 4 |
| Written English | never | always, next to the picture |
| Activities | chant, listen & tap, movement break | + phonics, sentence frames, memory board, say-it |
| Review intervals | 1, 1, 2, 3, 5 days | 1, 2, 4, 8, 16 days |

Both tracks share the pet companion, the achievement cards, the sticker book,
and the spaced-repetition scheduler.

## The design rules it follows

These are the decisions everything else falls out of. They are worth knowing
before changing anything.

- **Receptive before productive.** Recognising comes first; a 2-year-old is
  never asked to speak. Production (say-it) is age 5 only and is never scored,
  because a self-report must not be allowed to drive the review schedule.
- **Comprehensible input, dual-coded.** Picture and English audio always
  together. Latvian appears in the interface and behind an opt-in 🇱🇻 hint —
  never as the route to meaning.
- **Errorless.** No buzzer, no red X, no timer, no lives, no losing screen. A
  wrong tap dims that option, the pet re-asks, and the right answer stays there.
  Every question ends in success, and every missed word comes back later in the
  same session.
- **Gains only.** Streaks count up and stop counting when a day is missed. There
  is no "streak lost" screen and nothing is ever taken away. Loss-aversion
  mechanics work on adults; on a five-year-old they read as punishment, and a
  2-year-old has no say in whether the tablet comes out today.
- **New words never crowd out review.** At most half a session goes on new
  vocabulary. Meeting five words today and forgetting four by tomorrow is the
  exact failure spaced repetition exists to prevent.
- **Ritual over variety, for toddlers.** Same chant, same movement break, same
  ending, every time. Predictability is what lets a small child spend attention
  on the English instead of on working out what the app wants.

## Running it

No build step, no dependencies. Modules and the service worker need real HTTP,
so `file://` will not work:

```bash
npm run serve       # python3 -m http.server 8000
# open http://localhost:8000/
```

Tests are Node's built-in runner, also with no dependencies:

```bash
npm test            # node --test 'tests/*.test.js'
```

## Deploying

Settings → Pages → **Deploy from a branch**, branch `main`, folder `/ (root)`.
That is the whole pipeline: `git push` is the deploy. `.nojekyll` stops GitHub
from hiding anything, and every path in the app is relative so it works under
the `/ENG-learning/` subpath.

## Releasing

`src/version.js` is the source of truth. On each release:

1. Bump `APP_VERSION` in `src/version.js`.
2. Bump `VERSION` in `sw.js` to match — a service worker cannot import a
   module, so this is the one duplicated number. `npm test` fails if they drift.
3. Add a `CHANGELOG.md` entry.
4. Push.

The version feeds the service-worker cache name, so a bump automatically
retires the old cache and every device picks the update up on next load.

## Project layout

```
src/
  data/        the curriculum: words, units, sentence frames, pets, achievements
  core/        pure logic: srs, selector, session, stats, achievements
  state/       localStorage: profiles, per-child progress, backup
  media/       speech, pictures, sound effects, microphone
  pet/         the companion state machine
  activities/  one module per activity, each `run(ctx) => Promise`
  ui/screens/  onboarding, home, play, trophies, parent
tests/         node --test, covering everything in core/ and state/
```

`core/` and `state/` are pure and fully tested. `ui/` and `activities/` are
verified by hand against the checklist below.

## Adding content

### A word

Append to `src/data/words.js`. `level: 2` also teaches it to toddlers; keep
those short, concrete and easy to picture.

```js
{ id: 'owl', en: 'owl', lv: 'pūce', emoji: '🦉', unit: 'animals',
  level: 5, syl: 1, art: 'an' },
```

Never change an existing `id` — that is the storage key, and changing one
orphans that word's history. Adding is always safe.

Set `noPhon: true` if the spelling misleads about the first sound (*one*,
*eye*, *eight*), so the phonics activity skips it. Set `look: '<group>'` if the
picture is easy to confuse with another word's (🙋 hello / 👋 bye / ✋ hand are
all `wave`); toddlers will not be offered two words from the same group as
answer choices.

### An achievement card

Append to `src/data/achievements.js`. That is the entire job — no engine
change, no migration:

```js
{ id: 'words_200', tier: 'rainbow', emoji: '🌍',
  title: 'Divi simti!', hint: 'Apgūsti 200 vārdus',
  reward: { type: 'petAccessory', id: 'crown' },
  test: (s) => s.wordsMastered >= 200 },
```

`test` receives the snapshot built by `core/stats.js` — see `snapshot()` for
the available fields. The engine re-evaluates the whole catalogue against the
child's full history after every session, so **a card added today unlocks
retroactively** for a child who passed its threshold months ago.

One rule: conditions must be monotonic. Once true for a given history, always
true — a card must never be able to un-earn itself.

### Real audio or pictures

The app ships with emoji and speech synthesis so it works everywhere out of the
box, but both are swappable without touching code:

- **Audio** — drop `cat.mp3` into `assets/audio/en/`, list `"cat"` in
  `assets/audio/en/manifest.json`. `media/speech.js` prefers the recording and
  falls back to synthesis for anything not listed.
- **Pictures** — drop `cat.webp` into `assets/img/`, list `"cat"` in
  `assets/img/manifest.json`. Same deal via `media/picture.js`.

Recorded native audio is the single biggest quality upgrade available; it can
be done a few words at a time.

## Privacy

No backend, no analytics, no third-party requests — the app makes no network
calls at all after loading. Everything lives in this browser's `localStorage`.

The optional microphone activity (parent-enabled, off by default) keeps the
recording in memory, plays it back next to the model, and revokes it when the
round ends. It is never stored, never included in a backup, never uploaded.

Because storage is per-browser, **the backup export on the parent page is the
only way to move a child's progress to another device** — or to survive a
browser clearing its data.

## Manual QA checklist

Run through this before a release, on the actual tablet:

- [ ] Both age profiles complete a full session start to finish
- [ ] Age 2: two choices, no written words, tap targets comfortably big
- [ ] Age 5: four choices, written words, phonics and a sentence frame appear
- [ ] A wrong tap never blocks progress, and that word returns later
- [ ] Audio speaks on the first tap (this is the one iOS regularly breaks)
- [ ] Pet reacts: asks, cheers, encourages, dances at the movement break,
      sleeps on home, and points after the hint delay
- [ ] `prefers-reduced-motion` removes movement but keeps the pet's reactions
- [ ] An achievement card flips in at the end of a session
- [ ] Parent page: charts, weak words, word table, all settings, export→import
- [ ] Installed to the home screen, a full session runs with the network off
- [ ] No horizontal scrolling in portrait or landscape
