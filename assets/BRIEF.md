# Asset brief

Everything here is **optional**. The app ships working, using emoji and browser
speech. Each file below replaces one of those fallbacks the moment it exists —
no code change, no rebuild.

**How to add anything:** drop the file in the right folder, then add its id to
`assets/img/manifest.json` (or `assets/audio/en/manifest.json`). If an id is not
in the manifest, the file is ignored — that is what stops the app firing off a
404 for every word it does not have artwork for.

Priority order, highest value first:

1. **Recorded audio** — biggest single quality jump. Native pronunciation.
2. **Story scenes** — 7 files, and they carry the whole adventure.
3. **Story heroes** — 4 files.
4. **Word pictures** — 144 possible, but only worth doing where emoji are weak.

---

## 1. Recorded audio (highest value)

**Folder:** `assets/audio/en/` · **Format:** `.mp3`, mono, ~48–96 kbps
**Filename:** `<word id>.mp3` — the ids are the `id:` field in
`src/data/words.js` (e.g. `cat.mp3`, `thankyou.mp3`, `goodnight.mp3`)
**Manifest:** `assets/audio/en/manifest.json` — `["cat", "dog", ...]`

How to record them:

- One word per file, **American English**, clear and unhurried but not robotic.
- Leave ~150 ms of silence at the start and end. No music, no effects.
- A warm adult voice reading to a child, not an announcer.
- Say the word alone — no "cat!" with an exclamation, no carrier sentence.

This can be done a few words at a time. Anything not recorded falls back to
speech synthesis automatically, so a half-finished set is perfectly fine.

---

## 2. Story scenes

**Folder:** `assets/img/scenes/` · **Format:** `.webp`
**Size:** 1200 × 675 (16:9), will be cropped to fill
**Manifest ids:** prefixed `scene:` — e.g. `["scene:home", "scene:night"]`

Seven backgrounds. They sit **behind** a character and a line of text, so the
middle of the frame must stay calm and uncluttered — detail belongs at the
edges. No text in the image. Soft, warm, storybook illustration.

| File | Manifest id | Shows |
|---|---|---|
| `home.webp` | `scene:home` | A cosy room interior, daytime, warm light. Where a pet would nap. |
| `night.webp` | `scene:night` | The same kind of room at night, or a bedroom. Moon at a window, deep blue, calm. |
| `road.webp` | `scene:road` | An open country road heading off into the distance under a bright sky. |
| `rain.webp` | `scene:rain` | Grey-blue outdoors in the rain. Puddles, wet leaves. Gentle, not gloomy. |
| `forest.webp` | `scene:forest` | Friendly green woodland, trees on both sides, path or clearing in the middle. |
| `snow.webp` | `scene:snow` | Snowy landscape, pale blue and white, soft daylight. |
| `water.webp` | `scene:water` | A calm pond or lakeside with reeds. Blue-green, sunny. |

## 3. Story heroes

**Folder:** `assets/img/heroes/` · **Format:** `.webp` with transparency
**Size:** 512 × 512 square
**Manifest ids:** prefixed `hero:` — e.g. `["hero:cat", "hero:dog"]`

Four characters, one per story. Each should read clearly at about 90 px, so:
big head, simple shapes, strong silhouette, friendly face looking out at the
child. Same art style across all four.

| File | Manifest id | Character | Story |
|---|---|---|---|
| `cat.webp` | `hero:cat` | A cat | "Izsalkušais kaķis" — the hungry cat |
| `dog.webp` | `hero:dog` | A dog | "Suņa ceļojums" — the dog's journey |
| `bear.webp` | `hero:bear` | A bear | "Lācis ziemā" — bear in winter |
| `duck.webp` | `hero:duck` | A duckling | "Pazudusī pīle" — the lost duck |

## 4. Word pictures

**Folder:** `assets/img/` · **Format:** `.webp`, square, transparent background
**Size:** 512 × 512
**Filename:** `<word id>.webp`
**Manifest ids:** the bare word id — e.g. `["cat", "apple"]`

Only worth doing where the emoji is genuinely weak. The emoji set handles
concrete nouns well; these are the ones that are a stretch:

| Word id | Currently | Problem |
|---|---|---|
| `head` | 🙂 | A smiling face, not a head |
| `hair` | 💇 | A haircut being given |
| `table` | 🍽️ | A place setting, not a table |
| `hungry` | 🤤 | Drooling, which is not the same thing |
| `thankyou` | 🤗 | A hug |
| `please` | 🙏 | Reads as praying |
| `sorry` | 😔 | A sad face |
| `jump` | 🦘 | A kangaroo — the animal, not the action |
| `wind` | 🌬️ | A blowing face |
| `love` | ❤️ | Fine, but a heart is abstract for a toddler |

### Alternate pictures (for transfer checks)

If you make word pictures, a **second** picture of the same thing is worth as
much as the first. That is what the transfer check uses — a child who only ever
sees one image of a cat may have learned the image rather than the word, and
the only way to find out is to show them a different cat.

**Filename:** `<word id>__alt.webp` · **Manifest id:** `<word id>__alt`

Rules for a good alternate:
- Clearly the **same kind of thing**, clearly **not the same picture**.
  A different breed of dog, a different car, a different apple.
- For **colours**, use the same colour on a completely different object — a red
  rose for `red`, not another red circle. This is the sharpest transfer test in
  the whole set.
- Never reuse another word's picture.

76 words already have an emoji alternate (see the `alt:` field in
`src/data/words.js`); drawn versions would simply replace them.

---

## Icons and favicon

Already generated from `favicon.svg`. If you want a proper app icon, replace:

- `favicon.svg` — the source mark, any square SVG
- `assets/icons/icon-192.png`, `icon-512.png` — plain icons
- `assets/icons/icon-512-maskable.png` — same mark with ~20% padding all round,
  so a circular mask on Android cannot clip it

---

## What NOT to add

Some things would actively make the app worse, and the code deliberately has no
slot for them:

- **Background music.** It competes with the English for the same attention.
- **Decorative animations and clickable surprises.** A child who finds that
  poking the screen produces effects learns to hunt for effects instead of
  listening. Only things that answer the question are interactive.
- **Reward art** — coins, trophy piles, loot. The reward is meant to be the
  language working and the story moving on. Making the prizes more interesting
  than the adventure is the failure mode this version was built to avoid.
