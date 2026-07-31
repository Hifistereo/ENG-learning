# Asset brief — every picture the app can use

**243 image files in total.** Every one is optional: the app ships working,
using emoji. Each file replaces its emoji the moment it exists, with no code
change and no rebuild.

| # | What | Files | Size | Priority |
|---|---|---|---|---|
| 1 | Story scene backgrounds | **7** | 1200 × 675 | ★★★ do first |
| 2 | Story heroes | **4** | 512 × 512 | ★★★ |
| 3 | Pet companions | **8** | 512 × 512 | ★★★ |
| 4 | The alien | **1** | 512 × 512 | ★★ |
| 5 | Word pictures | **144** | 512 × 512 | ★★ do by unit |
| 6 | Second pictures (transfer) | **76** | 512 × 512 | ★★ |
| 7 | App icons | **3** | 192 / 512 / 512 | ★ |

Items 1–4 are **20 files** and cover every character and background in the app.
That is the set worth doing first — it changes how the whole thing looks. Items
5–6 are a long tail you can chip away at one unit at a time, in any order.

---

## How to install anything

1. Save the file at the path given in its table.
2. Add its **manifest id** to `assets/img/manifest.json`:

```json
["cat", "cat__alt", "scene:forest", "hero:cat", "pet:dragon", "char:alien"]
```

Anything not listed is ignored — that is what stops the app firing off a 404
for every word that has no artwork yet. A half-finished set is completely fine;
missing files keep their emoji.

## House style (applies to everything)

- **Format:** WebP. PNG also works if you rename the extension in the manifest
  path — but WebP is a third the size and every target browser supports it.
- **Background:** transparent for characters, objects and words. Only the seven
  scene backgrounds are full-bleed.
- **Read at small sizes.** Most artwork is displayed between 60 px and 150 px
  on a tablet. Big simple shapes, strong silhouette, thick outlines. Fine
  detail, thin lines and small text disappear.
- **One subject, centred, facing the viewer.** No scenes-within-objects.
- **Warm, friendly, storybook.** The same style across all 243 files matters
  more than any individual file being beautiful.
- **No text in any image.** The app is used by children who cannot read, and
  the interface is Latvian while the words are English.
- **Nothing frightening.** No bared teeth, no dark shadows, no sad faces except
  where the word *is* the feeling.

---

## 1. Story scenes — 7 files

**Folder:** `assets/img/scenes/` · **Size:** 1200 × 675 (16:9) · **Manifest:** `scene:<name>`

These sit **behind** a character and one or two lines of text. The **centre of
the frame must stay calm and uncluttered** — put detail at the edges and along
the bottom. Think of it as a stage backdrop, not an illustration in its own
right. Low contrast in the middle, so dark text stays readable on top.

| # | File | Manifest id | Used by | What it shows |
|---|---|---|---|---|
| 1 | `home.webp` | `scene:home` | Hungry cat; Bear indoors; Duck's ending | A cosy room seen from inside, daytime. Warm yellow light, a rug, maybe a window with sun coming in and the corner of a table or armchair at the edges. The kind of room where a pet would nap. Calm cream/amber middle. |
| 2 | `night.webp` | `scene:night` | Cat's bedtime; Bear's bedtime | The same kind of room, or a child's bedroom, at night. Deep blue, a moon and a few stars through a window, a soft lamp glow low in the frame. Peaceful and sleepy, not dark or scary. |
| 3 | `road.webp` | `scene:road` | Dog's journey opening | An open country road running away from the viewer toward a horizon. Bright daytime sky, green fields or low hills either side. Empty road — vehicles appear as separate props on top. |
| 4 | `rain.webp` | `scene:rain` | Dog in the rain | Outdoors in gentle rain. Grey-blue sky, visible raindrops, puddles along the bottom edge, wet grass. Cosy-drizzly rather than a storm — no lightning, no black clouds. |
| 5 | `forest.webp` | `scene:forest` | Dog outdoors; Duck looking up | Friendly deciduous woodland. Rounded green trees down both sides, a clearing or path through the middle, dappled light. Bright and open, never dense or gloomy. |
| 6 | `snow.webp` | `scene:snow` | Bear in winter | A snowy landscape. White ground, pale blue sky, a few snow-topped fir trees at the edges, gentle falling flakes. Soft daylight, long soft shadows. Cold-looking but inviting. |
| 7 | `water.webp` | `scene:water` | Lost duck opening | A calm pond or lake edge. Blue-green still water filling the lower half, reeds and grasses at the left and right edges, sunny sky above. Ripples but no waves. |

## 2. Story heroes — 4 files

**Folder:** `assets/img/heroes/` · **Size:** 512 × 512, transparent · **Manifest:** `hero:<id>`

One character per story. They appear at roughly 90–145 px, standing on the
scene background. **Big head, small body, strong silhouette, friendly face
looking straight out at the child.** Full body, standing, front-facing, feet
near the bottom of the frame. Same art style across all four.

| # | File | Manifest id | Character | Story | Expression |
|---|---|---|---|---|---|
| 1 | `cat.webp` | `hero:cat` | A house cat | *Izsalkušais kaķis* — the hungry cat | Hopeful and a bit hungry; sitting or standing, tail up |
| 2 | `dog.webp` | `hero:dog` | A friendly dog | *Suņa ceļojums* — the dog's journey | Eager, ready to set off, ears up |
| 3 | `bear.webp` | `hero:bear` | A brown bear cub | *Lācis ziemā* — the bear in winter | Soft and slightly chilly; round, huggable, not wild |
| 4 | `duck.webp` | `hero:duck` | A yellow duckling | *Pazudusī pīle* — the lost duck | Small and a little lost, but not distressed |

## 3. Pet companions — 8 files

**Folder:** `assets/img/pets/` · **Size:** 512 × 512, transparent · **Manifest:** `pet:<id>`

**The most-seen artwork in the whole app.** The child picks one at the start,
names it, and it then appears on the home screen, in the corner of every
activity, at every celebration and on the trophy screen. It is squashed,
stretched, spun and bounced by CSS animation, so:

- **Front-facing, upright, symmetrical, centred**, with a little padding all
  round so a jump animation does not clip the head.
- **Head-and-shoulders or full body, but always vertical** — the sprite is
  scaled uniformly and a wide pose will look small.
- **Neutral-happy expression.** One picture has to work for asking a question,
  cheering, encouraging, dancing and sleeping, so nothing too specific.
- Displayed 60–115 px, so keep it very simple.

| # | File | Manifest id | Pet | Latviski | Default name |
|---|---|---|---|---|---|
| 1 | `cat.webp` | `pet:cat` | Kitten | Kaķēns | Minka |
| 2 | `dog.webp` | `pet:dog` | Puppy | Sunītis | Reksis |
| 3 | `dragon.webp` | `pet:dragon` | Small friendly dragon | Pūķis | Dzirkstis |
| 4 | `bunny.webp` | `pet:bunny` | Rabbit | Zaķis | Ausainis |
| 5 | `owl.webp` | `pet:owl` | Owl | Pūce | Gudrīte |
| 6 | `monkey.webp` | `pet:monkey` | Monkey | Pērtiķis | Bimbo |
| 7 | `unicorn.webp` | `pet:unicorn` | Unicorn | Vienradzis | Varavīksne |
| 8 | `penguin.webp` | `pet:penguin` | Penguin | Pingvīns | Ledus |

> The pet also wears accessories earned from achievement cards — a cap, crown,
> bow, scarf, medal, sunglasses, wand and sparkles. Those stay as emoji laid
> over the sprite, so **do not draw them onto the pet**. Leave the head and
> neck reasonably clear.

## 4. The alien — 1 file

**Folder:** `assets/img/characters/` · **Size:** 512 × 512, transparent · **Manifest:** `char:alien`

| # | File | Manifest id | What it shows |
|---|---|---|---|
| 1 | `alien.webp` | `char:alien` | A small, goofy, obviously harmless alien. This is the character who confidently gets words wrong so the child can correct it — so it should look **silly rather than clever**: slightly baffled expression, maybe one antenna crooked. The child needs to feel smarter than it. Front-facing, full body, bright colours. |

---

## 5. Word pictures — 144 files

**Folder:** `assets/img/` (flat, no subfolder) · **Size:** 512 × 512, transparent
**Manifest:** the bare word id, e.g. `"cat"`

One picture per vocabulary word. **The picture carries the entire meaning** —
there is no text for a pre-literate child — so it has to be unmistakable to a
2-year-old with no context.

- **One object, centred, filling most of the frame.** No backgrounds, no
  scenery, no hands holding things unless the word is a body part.
- **The most typical example of the thing.** A red apple, not a rare variety.
- **Distinct from every other word in the same unit** — those are what appear
  side by side as answer choices.
- The **age** column says which children see it. `2+` words are shown to the
  toddler at up to 270 px, so those especially need to be simple and bold.

### Worth doing first

These ten have the weakest emoji, where the current picture is actively
misleading. Drawing these has more effect than any other word:

| File | Word | Currently | Why it is wrong |
|---|---|---|---|
| `head.webp` | head | 🙂 | A smiling face, not a head |
| `hair.webp` | hair | 💇 | Someone getting a haircut |
| `table.webp` | table | 🍽️ | A place setting, not a table |
| `hungry.webp` | hungry | 🤤 | Drooling, which is a different thing |
| `thankyou.webp` | thank you | 🤗 | A hug |
| `please.webp` | please | 🙏 | Reads as praying |
| `sorry.webp` | sorry | 😔 | A generic sad face |
| `jump.webp` | jump | 🦘 | A kangaroo — the animal, not the action |
| `wind.webp` | wind | 🌬️ | A face blowing |
| `love.webp` | love | ❤️ | Fine, but abstract for a toddler |

For **actions** (`jump`, `run`, `eat`, `sleep`…) draw a simple figure clearly
performing it, mid-motion. For **feelings**, a clear facial expression, big and
readable. For **colours**, see the note in section 6 — colours are the one case
where the second picture matters more than the first.

### 6. Second pictures — 76 files

**Same folder and size.** Filename gets `__alt` (two underscores):
`cat__alt.webp`, manifest id `"cat__alt"`.

**This is the most pedagogically valuable artwork in the list**, and the
easiest to get wrong. A child who only ever sees one picture of a cat may have
learned *that picture*, not the word — the second picture is how the app finds
out. So:

- **Clearly the same kind of thing. Clearly not the same picture.** A different
  breed of dog. A different shape of car. A green apple where the first was red.
- Draw it in a **different pose, colour or variety** — not a mirrored or
  recoloured copy of the first.
- **Never reuse another word's picture.**
- **Colours are the important case.** The alternate must be the same colour on
  a *completely different object*: `red` is a red circle, `red__alt` should be a
  red rose or a red ball. All ten colours have alternates for exactly this
  reason, and getting these right is worth more than twenty nouns.

The `2nd now` column below shows the emoji currently used, which tells you what
each alternate is meant to depict.

---

## Full word list


#### 👋 Sasveicināšanās — `greetings` (8 words, 2 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `hello.webp` | **hello** | sveiki | 🙋 | — | — | 2+ |
| 2 | `bye.webp` | **bye** | atā | 👋 | — | — | 2+ |
| 3 | `please.webp` | **please** | lūdzu | 🙏 | — | — | 2+ |
| 4 | `thankyou.webp` | **thank you** | paldies | 🤗 | — | — | 2+ |
| 5 | `yes.webp` | **yes** | jā | ✅ | `yes__alt.webp` | 👍 | 2+ |
| 6 | `no.webp` | **no** | nē | ❌ | `no__alt.webp` | 👎 | 2+ |
| 7 | `sorry.webp` | **sorry** | piedod | 😔 | — | — | 5+ |
| 8 | `goodnight.webp` | **good night** | ar labu nakti | 🌛 | — | — | 5+ |

#### 🐶 Dzīvnieki — `animals` (15 words, 10 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `cat.webp` | **cat** | kaķis | 🐱 | `cat__alt.webp` | 🐈 | 2+ |
| 2 | `dog.webp` | **dog** | suns | 🐶 | `dog__alt.webp` | 🐕 | 2+ |
| 3 | `cow.webp` | **cow** | govs | 🐮 | `cow__alt.webp` | 🐄 | 2+ |
| 4 | `pig.webp` | **pig** | cūka | 🐷 | `pig__alt.webp` | 🐖 | 2+ |
| 5 | `duck.webp` | **duck** | pīle | 🦆 | — | — | 2+ |
| 6 | `bird.webp` | **bird** | putns | 🐦 | `bird__alt.webp` | 🕊️ | 2+ |
| 7 | `fish.webp` | **fish** | zivs | 🐟 | `fish__alt.webp` | 🐠 | 2+ |
| 8 | `horse.webp` | **horse** | zirgs | 🐴 | `horse__alt.webp` | 🐎 | 2+ |
| 9 | `bear.webp` | **bear** | lācis | 🐻 | — | — | 2+ |
| 10 | `sheep.webp` | **sheep** | aita | 🐑 | `sheep__alt.webp` | 🐏 | 5+ |
| 11 | `rabbit.webp` | **rabbit** | trusis | 🐰 | `rabbit__alt.webp` | 🐇 | 5+ |
| 12 | `frog.webp` | **frog** | varde | 🐸 | — | — | 5+ |
| 13 | `lion.webp` | **lion** | lauva | 🦁 | — | — | 5+ |
| 14 | `elephant.webp` | **elephant** | zilonis | 🐘 | — | — | 5+ |
| 15 | `monkey.webp` | **monkey** | pērtiķis | 🐵 | `monkey__alt.webp` | 🐒 | 5+ |

#### 🍎 Ēdiens — `food` (14 words, 8 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `apple.webp` | **apple** | ābols | 🍎 | `apple__alt.webp` | 🍏 | 2+ |
| 2 | `banana.webp` | **banana** | banāns | 🍌 | — | — | 2+ |
| 3 | `bread.webp` | **bread** | maize | 🍞 | `bread__alt.webp` | 🥖 | 2+ |
| 4 | `milk.webp` | **milk** | piens | 🥛 | `milk__alt.webp` | 🍼 | 2+ |
| 5 | `water.webp` | **water** | ūdens | 💧 | `water__alt.webp` | 🚰 | 2+ |
| 6 | `egg.webp` | **egg** | ola | 🥚 | `egg__alt.webp` | 🍳 | 2+ |
| 7 | `cake.webp` | **cake** | kūka | 🍰 | `cake__alt.webp` | 🎂 | 2+ |
| 8 | `cheese.webp` | **cheese** | siers | 🧀 | — | — | 5+ |
| 9 | `carrot.webp` | **carrot** | burkāns | 🥕 | — | — | 5+ |
| 10 | `soup.webp` | **soup** | zupa | 🍲 | `soup__alt.webp` | 🥣 | 5+ |
| 11 | `cookie.webp` | **cookie** | cepums | 🍪 | — | — | 5+ |
| 12 | `juice.webp` | **juice** | sula | 🧃 | `juice__alt.webp` | 🍹 | 5+ |
| 13 | `potato.webp` | **potato** | kartupelis | 🥔 | — | — | 5+ |
| 14 | `strawberry.webp` | **strawberry** | zemene | 🍓 | — | — | 5+ |

#### 🎨 Krāsas — `colors` (10 words, 10 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `red.webp` | **red** | sarkans | 🔴 | `red__alt.webp` | 🌹 | 2+ |
| 2 | `blue.webp` | **blue** | zils | 🔵 | `blue__alt.webp` | 💙 | 2+ |
| 3 | `green.webp` | **green** | zaļš | 🟢 | `green__alt.webp` | 🥬 | 2+ |
| 4 | `yellow.webp` | **yellow** | dzeltens | 🟡 | `yellow__alt.webp` | 🌻 | 2+ |
| 5 | `black.webp` | **black** | melns | ⚫ | `black__alt.webp` | 🖤 | 5+ |
| 6 | `white.webp` | **white** | balts | ⚪ | `white__alt.webp` | 🤍 | 5+ |
| 7 | `orange.webp` | **orange** | oranžs | 🟠 | `orange__alt.webp` | 🍊 | 5+ |
| 8 | `pink.webp` | **pink** | rozā | 🌸 | `pink__alt.webp` | 💗 | 5+ |
| 9 | `purple.webp` | **purple** | violets | 🟣 | `purple__alt.webp` | 💜 | 5+ |
| 10 | `brown.webp` | **brown** | brūns | 🟤 | `brown__alt.webp` | 🤎 | 5+ |

#### 👀 Ķermenis — `body` (11 words, 4 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `eye.webp` | **eye** | acs | 👁️ | `eye__alt.webp` | 👀 | 2+ |
| 2 | `nose.webp` | **nose** | deguns | 👃 | — | — | 2+ |
| 3 | `mouth.webp` | **mouth** | mute | 👄 | — | — | 2+ |
| 4 | `ear.webp` | **ear** | auss | 👂 | `ear__alt.webp` | 🦻 | 2+ |
| 5 | `hand.webp` | **hand** | roka | ✋ | `hand__alt.webp` | 🤚 | 2+ |
| 6 | `head.webp` | **head** | galva | 🙂 | — | — | 2+ |
| 7 | `hair.webp` | **hair** | mati | 💇 | — | — | 5+ |
| 8 | `foot.webp` | **foot** | pēda | 🦶 | — | — | 5+ |
| 9 | `leg.webp` | **leg** | kāja | 🦵 | — | — | 5+ |
| 10 | `tooth.webp` | **tooth** | zobs | 🦷 | — | — | 5+ |
| 11 | `finger.webp` | **finger** | pirksts | 👆 | `finger__alt.webp` | 👉 | 5+ |

#### 👨‍👩‍👧 Ģimene — `family` (8 words, 1 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `mom.webp` | **mom** | mamma | 👩 | — | — | 2+ |
| 2 | `dad.webp` | **dad** | tētis | 👨 | — | — | 2+ |
| 3 | `baby.webp` | **baby** | mazulis | 👶 | — | — | 2+ |
| 4 | `sister.webp` | **sister** | māsa | 👧 | — | — | 5+ |
| 5 | `brother.webp` | **brother** | brālis | 👦 | — | — | 5+ |
| 6 | `grandma.webp` | **grandma** | vecmāmiņa | 👵 | — | — | 5+ |
| 7 | `grandpa.webp` | **grandpa** | vectētiņš | 👴 | — | — | 5+ |
| 8 | `family.webp` | **family** | ģimene | 👨‍👩‍👧 | `family__alt.webp` | 👪 | 5+ |

#### 🔢 Skaitļi — `numbers` (10 words, 0 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `one.webp` | **one** | viens | 1️⃣ | — | — | 5+ |
| 2 | `two.webp` | **two** | divi | 2️⃣ | — | — | 5+ |
| 3 | `three.webp` | **three** | trīs | 3️⃣ | — | — | 5+ |
| 4 | `four.webp` | **four** | četri | 4️⃣ | — | — | 5+ |
| 5 | `five.webp` | **five** | pieci | 5️⃣ | — | — | 5+ |
| 6 | `six.webp` | **six** | seši | 6️⃣ | — | — | 5+ |
| 7 | `seven.webp` | **seven** | septiņi | 7️⃣ | — | — | 5+ |
| 8 | `eight.webp` | **eight** | astoņi | 8️⃣ | — | — | 5+ |
| 9 | `nine.webp` | **nine** | deviņi | 9️⃣ | — | — | 5+ |
| 10 | `ten.webp` | **ten** | desmit | 🔟 | — | — | 5+ |

#### 🧸 Rotaļlietas — `toys` (9 words, 2 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `ball.webp` | **ball** | bumba | ⚽ | `ball__alt.webp` | 🏀 | 2+ |
| 2 | `doll.webp` | **doll** | lelle | 🪆 | — | — | 2+ |
| 3 | `teddy.webp` | **teddy** | lācītis | 🧸 | — | — | 2+ |
| 4 | `book.webp` | **book** | grāmata | 📖 | `book__alt.webp` | 📕 | 2+ |
| 5 | `balloon.webp` | **balloon** | balons | 🎈 | — | — | 2+ |
| 6 | `blocks.webp` | **blocks** | klucīši | 🧱 | — | — | 5+ |
| 7 | `kite.webp` | **kite** | pūķis | 🪁 | — | — | 5+ |
| 8 | `drum.webp` | **drum** | bungas | 🥁 | — | — | 5+ |
| 9 | `puzzle.webp` | **puzzle** | puzle | 🧩 | — | — | 5+ |

#### 👕 Apģērbs — `clothes` (9 words, 2 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `hat.webp` | **hat** | cepure | 🧢 | `hat__alt.webp` | 👒 | 2+ |
| 2 | `shoes.webp` | **shoes** | kurpes | 👟 | `shoes__alt.webp` | 👞 | 2+ |
| 3 | `socks.webp` | **socks** | zeķes | 🧦 | — | — | 2+ |
| 4 | `shirt.webp` | **shirt** | krekls | 👕 | — | — | 5+ |
| 5 | `pants.webp` | **pants** | bikses | 👖 | — | — | 5+ |
| 6 | `jacket.webp` | **jacket** | jaka | 🧥 | — | — | 5+ |
| 7 | `dress.webp` | **dress** | kleita | 👗 | — | — | 5+ |
| 8 | `scarf.webp` | **scarf** | šalle | 🧣 | — | — | 5+ |
| 9 | `gloves.webp` | **gloves** | cimdi | 🧤 | — | — | 5+ |

#### 🏠 Mājas — `home` (11 words, 6 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `house.webp` | **house** | māja | 🏠 | `house__alt.webp` | 🏡 | 2+ |
| 2 | `door.webp` | **door** | durvis | 🚪 | — | — | 2+ |
| 3 | `bed.webp` | **bed** | gulta | 🛏️ | `bed__alt.webp` | 🛌 | 2+ |
| 4 | `spoon.webp` | **spoon** | karote | 🥄 | — | — | 2+ |
| 5 | `cup.webp` | **cup** | krūze | ☕ | `cup__alt.webp` | 🍵 | 2+ |
| 6 | `chair.webp` | **chair** | krēsls | 🪑 | — | — | 5+ |
| 7 | `table.webp` | **table** | galds | 🍽️ | — | — | 5+ |
| 8 | `window.webp` | **window** | logs | 🪟 | — | — | 5+ |
| 9 | `key.webp` | **key** | atslēga | 🔑 | `key__alt.webp` | 🗝️ | 5+ |
| 10 | `lamp.webp` | **lamp** | lampa | 💡 | `lamp__alt.webp` | 🪔 | 5+ |
| 11 | `clock.webp` | **clock** | pulkstenis | 🕐 | `clock__alt.webp` | ⏰ | 5+ |

#### 🚗 Transports — `vehicles` (8 words, 7 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `car.webp` | **car** | mašīna | 🚗 | `car__alt.webp` | 🚙 | 2+ |
| 2 | `bus.webp` | **bus** | autobuss | 🚌 | `bus__alt.webp` | 🚍 | 2+ |
| 3 | `train.webp` | **train** | vilciens | 🚂 | `train__alt.webp` | 🚆 | 2+ |
| 4 | `plane.webp` | **plane** | lidmašīna | ✈️ | `plane__alt.webp` | 🛩️ | 2+ |
| 5 | `bike.webp` | **bike** | velosipēds | 🚲 | `bike__alt.webp` | 🚴 | 2+ |
| 6 | `boat.webp` | **boat** | laiva | ⛵ | `boat__alt.webp` | 🚤 | 5+ |
| 7 | `truck.webp` | **truck** | kravas mašīna | 🚚 | `truck__alt.webp` | 🚛 | 5+ |
| 8 | `tractor.webp` | **tractor** | traktors | 🚜 | — | — | 5+ |

#### 🌳 Daba — `nature` (11 words, 9 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `sun.webp` | **sun** | saule | ☀️ | `sun__alt.webp` | 🌞 | 2+ |
| 2 | `moon.webp` | **moon** | mēness | 🌙 | `moon__alt.webp` | 🌝 | 2+ |
| 3 | `star.webp` | **star** | zvaigzne | ⭐ | `star__alt.webp` | 🌟 | 2+ |
| 4 | `tree.webp` | **tree** | koks | 🌳 | `tree__alt.webp` | 🌲 | 2+ |
| 5 | `flower.webp` | **flower** | puķe | 🌼 | `flower__alt.webp` | 🌷 | 2+ |
| 6 | `rain.webp` | **rain** | lietus | 🌧️ | `rain__alt.webp` | ☔ | 2+ |
| 7 | `snow.webp` | **snow** | sniegs | ❄️ | `snow__alt.webp` | 🌨️ | 2+ |
| 8 | `cloud.webp` | **cloud** | mākonis | ☁️ | `cloud__alt.webp` | 🌥️ | 5+ |
| 9 | `wind.webp` | **wind** | vējš | 🌬️ | — | — | 5+ |
| 10 | `leaf.webp` | **leaf** | lapa | 🍃 | `leaf__alt.webp` | 🍂 | 5+ |
| 11 | `stone.webp` | **stone** | akmens | 🪨 | — | — | 5+ |

#### 🏃 Darbības — `actions` (12 words, 8 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `jump.webp` | **jump** | lēkt | 🦘 | `jump__alt.webp` | ⛹️ | 2+ |
| 2 | `run.webp` | **run** | skriet | 🏃 | `run__alt.webp` | 🏃‍♀️ | 2+ |
| 3 | `clap.webp` | **clap** | plaukšķināt | 👏 | — | — | 2+ |
| 4 | `dance.webp` | **dance** | dejot | 💃 | `dance__alt.webp` | 🕺 | 2+ |
| 5 | `eat.webp` | **eat** | ēst | 😋 | — | — | 2+ |
| 6 | `drink.webp` | **drink** | dzert | 🥤 | — | — | 2+ |
| 7 | `sleep.webp` | **sleep** | gulēt | 😴 | `sleep__alt.webp` | 💤 | 2+ |
| 8 | `sing.webp` | **sing** | dziedāt | 🎤 | `sing__alt.webp` | 🎶 | 5+ |
| 9 | `swim.webp` | **swim** | peldēt | 🏊 | `swim__alt.webp` | 🏊‍♀️ | 5+ |
| 10 | `walk.webp` | **walk** | iet | 🚶 | `walk__alt.webp` | 🚶‍♀️ | 5+ |
| 11 | `read.webp` | **read** | lasīt | 📚 | — | — | 5+ |
| 12 | `wash.webp` | **wash** | mazgāt | 🧼 | `wash__alt.webp` | 🚿 | 5+ |

#### 😄 Sajūtas — `feelings` (8 words, 7 with a second picture)

| # | file | word | latviski | now | 2nd file | 2nd now | age |
|---|---|---|---|---|---|---|---|
| 1 | `happy.webp` | **happy** | priecīgs | 😄 | `happy__alt.webp` | 😃 | 2+ |
| 2 | `sad.webp` | **sad** | skumjš | 😢 | `sad__alt.webp` | 😭 | 2+ |
| 3 | `love.webp` | **love** | mīlestība | ❤️ | `love__alt.webp` | 💖 | 2+ |
| 4 | `angry.webp` | **angry** | dusmīgs | 😠 | `angry__alt.webp` | 😡 | 5+ |
| 5 | `tired.webp` | **tired** | noguris | 🥱 | `tired__alt.webp` | 😪 | 5+ |
| 6 | `hungry.webp` | **hungry** | izsalcis | 🤤 | — | — | 5+ |
| 7 | `scared.webp` | **scared** | nobijies | 😨 | `scared__alt.webp` | 😱 | 5+ |
| 8 | `funny.webp` | **funny** | smieklīgs | 🤣 | `funny__alt.webp` | 😂 | 5+ |
---

## 7. App icons — 3 files

**Folder:** `assets/icons/` · **Manifest:** none — these are referenced directly

The icon shown on the tablet home screen once the app is installed. Currently
generated from `favicon.svg` (a yellow rounded square with an open book).

| # | File | Size | What it shows |
|---|---|---|---|
| 1 | `icon-192.png` | 192 × 192 | The app mark, filling the frame. Opaque background — no transparency. |
| 2 | `icon-512.png` | 512 × 512 | The same mark at full size. |
| 3 | `icon-512-maskable.png` | 512 × 512 | The same mark with **~20 % empty padding on all sides**, on a solid background colour. Android crops icons to a circle or squircle, and without the padding the edges get cut off. |

Optionally also replace `favicon.svg` in the project root — any square SVG.
If you do, the three PNGs can be regenerated from it rather than drawn.

---

## Not needed as pictures

These are emoji and staying that way. Drawing them would be wasted effort
because the code has no slot for them:

- **Pet accessories** (cap, crown, bow, scarf, medal, sunglasses, wand,
  sparkles) — laid over the pet sprite as emoji so they can be mixed and
  matched as the child earns them.
- **Session stickers** (🌟 🎈 🍀 🌈 🦋 🚀 🐝 🍄) — one per completed session in
  the sticker book.
- **Achievement card art** — each card's emoji is part of its data, and new
  cards are added by writing one line in `src/data/achievements.js`.
- **The basket** in the give-me game, and small interface icons.

Ask if you want any of these wired up — each is a small change.

## Please do NOT add

Some things would make the app measurably worse, and there is deliberately
nowhere to put them:

- **Background music.** It competes with the English for the same attention.
- **Decorative animations and clickable surprises.** A child who discovers that
  poking the screen produces effects learns to hunt for effects instead of
  listening. Only the things that answer the question are interactive.
- **Reward art** — coins, trophy piles, treasure. The reward is meant to be the
  language working and the story moving on. Making the prizes more interesting
  than the adventure is the exact failure this version was built to avoid.

---

## Recordings (not pictures, but the highest-value addition of all)

Listed here for completeness because it outranks every image in the list.

**Folder:** `assets/audio/en/` · **Format:** `.mp3`, mono, 48–96 kbps
**Filename:** `<word id>.mp3` — the same ids as the word pictures
**Manifest:** `assets/audio/en/manifest.json`, bare ids: `["cat", "dog"]`

144 files, one per word. American English, a warm adult voice reading to a
child rather than an announcer. Say the word alone — no carrier sentence, no
exclamation. Leave ~150 ms of silence at each end. No music, no effects.

Anything not recorded falls back to the device's speech synthesis
automatically, so recording ten words is already worth doing.
