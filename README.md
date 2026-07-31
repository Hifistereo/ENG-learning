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
| Opens with | a card asking a grown-up to sit down | arriving in the scene |
| New words per session | 1–3 | 2–5 |
| Answer choices | 2 | 3–4 |
| Written English | never | always, next to the picture |
| Tasks | look around, meet a word, where-is, give-me, movement, transfer check, story | + phonics, sentence frames, teach-the-alien |
| Asked to speak | never | yes, once a word already transfers |
| Review intervals | 1, 2, 4, 7, 14 days | 1, 3, 7, 14, 30 days |

Both tracks share the pet companion, the achievement cards, the sticker book,
and the scheduler.

**A session is a visit to one place.** The child arrives in an illustrated
scene with their pet standing in it, everything happens there, and the pet
waves goodbye at the end. The same handful of words passes through every phase
— meet it, fetch it for someone, act it out, use it to rescue a character, then
say it — so each encounter is the same vocabulary in a different task, and the
screen never blanks between them.

There is no progress bar and no Latvian instruction anywhere the child can see
it. What a child meets is a character saying something in English; the Latvian,
if a parent leaves hints on, is a subtitle underneath.

Greetings — hello, bye, please, thank you, yes, no, sorry, good night — are
**not** in the word list and are never quizzed. You cannot draw "please", and
nobody learns "thank you" from a flashcard. The characters say them constantly
instead, at the moment that gives each one its meaning (`src/data/chatter.js`).

## What "knowing a word" means here

This is the most important thing in the codebase, so it is worth stating
plainly. **Correct answers are not the measure.** A child can tap the right
picture out of two twenty times in a row by remembering which side it was on,
and that knowledge evaporates the moment the picture changes.

So each word accumulates independent evidence, and each kind can only be earned
by a task that actually demonstrates it (`src/core/knowledge.js`):

| Evidence | Earned by |
|---|---|
| **recognises** | heard the word, picked the right picture, unaided |
| **transfers** | did that again with a *different picture of the same thing* |
| **says it** | said it out loud, confirmed by a grown-up |
| **next day** | got it right at least a day after first meeting it |
| **after a week** | got it right at least a week after first meeting it |

A word counts as known only with transfer **and** delayed recall — plus
production for the older track. Tapping a picture never counts as speech; no
amount of same-picture repetition ever counts as transfer; and an answer given
after the pet pointed at it counts for nothing at all.

Retention and transfer are what the parent page leads with. Minutes played and
session counts are still shown, but under a heading that says outright they
measure willingness, not learning.

## The other design rules

- **Receptive before productive.** A 2-year-old is never asked to speak.
  Production is age 5 only and only for words that already transfer.
- **Under three, it is co-play.** Learning from a screen transfers to real life
  much more weakly than learning from a person at that age, so toddler sessions
  open by asking for a grown-up and tell them what to do. The screen is the
  prop; the adult is the teacher.
- **Language has to be worth understanding.** Somebody wants the apple; the fox
  is cold; the alien got it wrong. Understanding gets the thing, moves the
  story, fixes the mistake — it does not score a point.
- **Animate the meaning, nothing else.** "jump" hops, "eat" vanishes into a
  mouth, "sleep" fades with a 💤. Words with no honest enactment get no
  animation, because decorative motion competes with the word for the same
  attention.
- **Errorless, and then it teaches.** After two misses the app stops testing:
  it names the word, shows what it means, and hands the child an easy success.
  No buzzer, no red X, no timer, no losing screen.
- **Gains only.** Streaks count up and stop when a day is missed. Nothing is
  ever taken away, and no reward is allowed to be more interesting than the
  adventure.
- **New words never crowd out review.** At most half a session goes on new
  vocabulary.
- **Ritual over variety, for toddlers.** Predictability is what lets a small
  child spend attention on the English instead of on working out what the app
  wants.

### What it deliberately does not do

- No memory-pairs game — it can be won by tracking card positions without
  processing a word of English.
- No automatic pronunciation scoring — speech recognition on a five-year-old
  with a Latvian accent is unreliable, and a false "wrong" is the most
  discouraging thing this app could do.
- No background music, no clickable surprises, no reward art. See the bottom of
  `assets/BRIEF.md`.

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
  data/        the curriculum: words, units, sentence frames, stories, pets, cards
  core/        pure logic — knowledge (what "known" means), srs (when a word
               comes back), selector, session, storyBuilder, stats, achievements
  state/       localStorage: profiles, per-child progress, backup, migrations
  media/       speech, pictures, scenes, meaning-matched animation, sfx, mic
  pet/         the companion state machine
  activities/  one module per task, each `run(ctx) => Promise`
  ui/          sceneStage (the visit), shared components, screens/
  ui/screens/  onboarding, home, play, trophies, parent
tests/         node --test, covering everything in core/ and state/
assets/        BRIEF.md plus the drop-in slots for audio and artwork
```

Two modules are deliberately kept apart: `core/knowledge.js` decides what an
answer *proves*, `core/srs.js` decides *when the word comes back*. They are
different questions — a word can be scheduled far out while still being weakly
known — and merging them is how mastery inflation creeps back in.

### The visit

A session is one illustrated place. `ui/sceneStage.js` builds it once and every
activity renders into it — the backdrop, the pet standing in the scene, the
caption and the prop shelf all persist, and a round changes only what is being
said and what is on the shelf. Nothing is torn down between rounds.

Two rules follow from that and are easy to break by accident:

- **Activities never clear the stage.** `stageWith()` still exists but is only
  for the co-play card, which is addressed to the adult before the visit
  starts. Inside the visit, call `ctx.scene`.
- **The English sentence is the prompt.** No Latvian imperative is ever shown
  to the child. `scene.say(en, lv)` puts the character's line in the caption
  and the translation, if hints are on, underneath it.

The pet is *moved* into the scene rather than redrawn there (`pet.dockPet`), so
there is only ever one pet element and its whole state machine keeps working.
Anything that replaces the stage must call `scene.release()` first, or the pet
gets removed from the document along with it.

`core/` and `state/` are pure and fully tested. `ui/` and `activities/` are
verified by hand against the checklist below.

## Adding content

### A word

Append to `src/data/words.js`. `level: 2` also teaches it to toddlers; keep
those short, concrete and easy to picture.

```js
{ id: 'owl', en: 'owl', lv: 'pūce', emoji: '🦉', alt: '🦅', unit: 'animals',
  level: 5, syl: 1, art: 'an' },
```

`alt` is a **second, visibly different picture of the same thing**, and it is
worth adding wherever an honest one exists — it is what the transfer check
uses. For colours the alternate should be the same colour on a completely
different object (🔴 → 🌹), which is the sharpest transfer test in the set.

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
- [ ] Age 2: co-play card first, two choices, no written words, big targets
- [ ] Age 5: four choices, written words, phonics and a sentence frame appear
- [ ] The story runs and a right answer visibly changes what happens
- [ ] "Give me the ___" only ever asks for things you could hand over
- [ ] A transfer round shows a picture the child has not been taught with
- [ ] Two wrong taps make the app teach the answer rather than ask again
- [ ] A wrong tap never blocks progress, and that word returns later
- [ ] Audio speaks on the first tap (this is the one iOS regularly breaks)
- [ ] Pet reacts: asks, cheers, encourages, dances at the movement break,
      sleeps on home, and points after the hint delay
- [ ] `prefers-reduced-motion` removes movement but keeps the pet's reactions
- [ ] An achievement card flips in at the end of a session
- [ ] Parent page: charts, weak words, word table, all settings, export→import
- [ ] Installed to the home screen, a full session runs with the network off
- [ ] No horizontal scrolling in portrait or landscape
