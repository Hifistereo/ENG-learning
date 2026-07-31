// The vocabulary. One line per word so this file stays easy to edit.
//
// Fields
//   id     stable key used in saved progress — NEVER change one after release,
//          or that word's history is orphaned. Adding words is always safe.
//   en     the English word the child hears and (from age 5) reads
//   lv     Latvian translation, shown to parents and behind the 🇱🇻 hint button
//   emoji  the picture; media/picture.js swaps in a real image if one exists
//   unit   thematic unit, see data/units.js
//   level  2 = also taught to toddlers, 5 = age five and up.
//          Toddler words are short, concrete and highly imageable.
//   syl    syllable count — the selector prefers short words for age 2
//   art    'a' | 'an' | null, used to build sentence frames correctly
//   alt    a SECOND, visibly different picture of the same thing. This is what
//          makes transfer checks possible — a child who only ever sees 🐱 may
//          have learned that one image, not the word "cat", and the difference
//          only shows when you hand them 🐈. For colours the alternate is the
//          same colour on a completely different object (🔴 → 🌹), which is
//          the strongest transfer test in the whole set. Words with no
//          convincing second emoji simply have no alt and are never used for
//          transfer.
//   noPhon set when the spelling misleads about the initial sound, so the
//          phonics activity skips it (e.g. "one" does not start with an /o/ sound)
//   look   optional visual-similarity group. Two words in the same group have
//          pictures a small child cannot reliably tell apart (🙋 hello vs 👋
//          bye vs ✋ hand are all "a waving person or hand"). The selector
//          keeps same-group words out of each other's answer choices for
//          toddlers, so the question stays a vocabulary question rather than a
//          visual puzzle. Colours and digits are deliberately NOT grouped:
//          there the picture difference IS the thing being taught.

const W = [
  // --- greetings ---------------------------------------------------------
  { id: 'hello',     en: 'hello',     lv: 'sveiki',        emoji: '🙋', unit: 'greetings', level: 2, syl: 2, art: null, look: 'wave' },
  { id: 'bye',       en: 'bye',       lv: 'atā',           emoji: '👋', unit: 'greetings', level: 2, syl: 1, art: null, look: 'wave' },
  { id: 'please',    en: 'please',    lv: 'lūdzu',         emoji: '🙏', unit: 'greetings', level: 2, syl: 1, art: null },
  { id: 'thankyou',  en: 'thank you', lv: 'paldies',       emoji: '🤗', unit: 'greetings', level: 2, syl: 2, art: null },
  { id: 'yes',       en: 'yes',       lv: 'jā',            emoji: '✅', unit: 'greetings', level: 2, syl: 1, art: null, alt: '👍' },
  { id: 'no',        en: 'no',        lv: 'nē',            emoji: '❌', unit: 'greetings', level: 2, syl: 1, art: null, alt: '👎' },
  { id: 'sorry',     en: 'sorry',     lv: 'piedod',        emoji: '😔', unit: 'greetings', level: 5, syl: 2, art: null },
  // 🌛 rather than 🌙, which belongs to "moon" — two words sharing one picture
  // would make either of them unanswerable.
  { id: 'goodnight', en: 'good night', lv: 'ar labu nakti', emoji: '🌛', unit: 'greetings', level: 5, syl: 2, art: null },

  // --- animals -----------------------------------------------------------
  { id: 'cat',      en: 'cat',      lv: 'kaķis',      emoji: '🐱', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🐈' },
  { id: 'dog',      en: 'dog',      lv: 'suns',       emoji: '🐶', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🐕' },
  { id: 'cow',      en: 'cow',      lv: 'govs',       emoji: '🐮', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🐄' },
  { id: 'pig',      en: 'pig',      lv: 'cūka',       emoji: '🐷', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🐖' },
  { id: 'duck',     en: 'duck',     lv: 'pīle',       emoji: '🦆', unit: 'animals', level: 2, syl: 1, art: 'a' },
  { id: 'bird',     en: 'bird',     lv: 'putns',      emoji: '🐦', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🕊️' },
  { id: 'fish',     en: 'fish',     lv: 'zivs',       emoji: '🐟', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🐠' },
  { id: 'horse',    en: 'horse',    lv: 'zirgs',      emoji: '🐴', unit: 'animals', level: 2, syl: 1, art: 'a', alt: '🐎' },
  { id: 'bear',     en: 'bear',     lv: 'lācis',      emoji: '🐻', unit: 'animals', level: 2, syl: 1, art: 'a' },
  { id: 'sheep',    en: 'sheep',    lv: 'aita',       emoji: '🐑', unit: 'animals', level: 5, syl: 1, art: 'a', alt: '🐏' },
  { id: 'rabbit',   en: 'rabbit',   lv: 'trusis',     emoji: '🐰', unit: 'animals', level: 5, syl: 2, art: 'a', alt: '🐇' },
  { id: 'frog',     en: 'frog',     lv: 'varde',      emoji: '🐸', unit: 'animals', level: 5, syl: 1, art: 'a' },
  { id: 'lion',     en: 'lion',     lv: 'lauva',      emoji: '🦁', unit: 'animals', level: 5, syl: 2, art: 'a' },
  { id: 'elephant', en: 'elephant', lv: 'zilonis',    emoji: '🐘', unit: 'animals', level: 5, syl: 3, art: 'an' },
  { id: 'monkey',   en: 'monkey',   lv: 'pērtiķis',   emoji: '🐵', unit: 'animals', level: 5, syl: 2, art: 'a', alt: '🐒' },

  // --- food --------------------------------------------------------------
  { id: 'apple',      en: 'apple',      lv: 'ābols',      emoji: '🍎', unit: 'food', level: 2, syl: 2, art: 'an', alt: '🍏' },
  { id: 'banana',     en: 'banana',     lv: 'banāns',     emoji: '🍌', unit: 'food', level: 2, syl: 3, art: 'a' },
  { id: 'bread',      en: 'bread',      lv: 'maize',      emoji: '🍞', unit: 'food', level: 2, syl: 1, art: null, alt: '🥖' },
  { id: 'milk',       en: 'milk',       lv: 'piens',      emoji: '🥛', unit: 'food', level: 2, syl: 1, art: null, alt: '🍼' },
  { id: 'water',      en: 'water',      lv: 'ūdens',      emoji: '💧', unit: 'food', level: 2, syl: 2, art: null, alt: '🚰' },
  { id: 'egg',        en: 'egg',        lv: 'ola',        emoji: '🥚', unit: 'food', level: 2, syl: 1, art: 'an', alt: '🍳' },
  { id: 'cake',       en: 'cake',       lv: 'kūka',       emoji: '🍰', unit: 'food', level: 2, syl: 1, art: 'a', alt: '🎂' },
  { id: 'cheese',     en: 'cheese',     lv: 'siers',      emoji: '🧀', unit: 'food', level: 5, syl: 1, art: null },
  { id: 'carrot',     en: 'carrot',     lv: 'burkāns',    emoji: '🥕', unit: 'food', level: 5, syl: 2, art: 'a' },
  { id: 'soup',       en: 'soup',       lv: 'zupa',       emoji: '🍲', unit: 'food', level: 5, syl: 1, art: null, alt: '🥣' },
  { id: 'cookie',     en: 'cookie',     lv: 'cepums',     emoji: '🍪', unit: 'food', level: 5, syl: 2, art: 'a' },
  { id: 'juice',      en: 'juice',      lv: 'sula',       emoji: '🧃', unit: 'food', level: 5, syl: 1, art: null, alt: '🍹' },
  { id: 'potato',     en: 'potato',     lv: 'kartupelis', emoji: '🥔', unit: 'food', level: 5, syl: 3, art: 'a' },
  { id: 'strawberry', en: 'strawberry', lv: 'zemene',     emoji: '🍓', unit: 'food', level: 5, syl: 3, art: 'a' },

  // --- colors ------------------------------------------------------------
  { id: 'red',    en: 'red',    lv: 'sarkans',  emoji: '🔴', unit: 'colors', level: 2, syl: 1, art: null, alt: '🌹' },
  { id: 'blue',   en: 'blue',   lv: 'zils',     emoji: '🔵', unit: 'colors', level: 2, syl: 1, art: null, alt: '💙' },
  { id: 'green',  en: 'green',  lv: 'zaļš',     emoji: '🟢', unit: 'colors', level: 2, syl: 1, art: null, alt: '🥬' },
  { id: 'yellow', en: 'yellow', lv: 'dzeltens', emoji: '🟡', unit: 'colors', level: 2, syl: 2, art: null, alt: '🌻' },
  { id: 'black',  en: 'black',  lv: 'melns',    emoji: '⚫', unit: 'colors', level: 5, syl: 1, art: null, alt: '🖤' },
  { id: 'white',  en: 'white',  lv: 'balts',    emoji: '⚪', unit: 'colors', level: 5, syl: 1, art: null, alt: '🤍' },
  { id: 'orange', en: 'orange', lv: 'oranžs',   emoji: '🟠', unit: 'colors', level: 5, syl: 2, art: null, alt: '🍊' },
  { id: 'pink',   en: 'pink',   lv: 'rozā',     emoji: '🌸', unit: 'colors', level: 5, syl: 1, art: null, alt: '💗' },
  { id: 'purple', en: 'purple', lv: 'violets',  emoji: '🟣', unit: 'colors', level: 5, syl: 2, art: null, alt: '💜' },
  { id: 'brown',  en: 'brown',  lv: 'brūns',    emoji: '🟤', unit: 'colors', level: 5, syl: 1, art: null, alt: '🤎' },

  // --- body --------------------------------------------------------------
  { id: 'eye',    en: 'eye',    lv: 'acs',     emoji: '👁️', unit: 'body', level: 2, syl: 1, art: 'an', noPhon: true, alt: '👀' },
  { id: 'nose',   en: 'nose',   lv: 'deguns',  emoji: '👃', unit: 'body', level: 2, syl: 1, art: 'a' },
  { id: 'mouth',  en: 'mouth',  lv: 'mute',    emoji: '👄', unit: 'body', level: 2, syl: 1, art: 'a' },
  { id: 'ear',    en: 'ear',    lv: 'auss',    emoji: '👂', unit: 'body', level: 2, syl: 1, art: 'an', alt: '🦻' },
  { id: 'hand',   en: 'hand',   lv: 'roka',    emoji: '✋', unit: 'body', level: 2, syl: 1, art: 'a', look: 'wave', alt: '🤚' },
  { id: 'head',   en: 'head',   lv: 'galva',   emoji: '🙂', unit: 'body', level: 2, syl: 1, art: 'a', look: 'face' },
  { id: 'hair',   en: 'hair',   lv: 'mati',    emoji: '💇', unit: 'body', level: 5, syl: 1, art: null },
  { id: 'foot',   en: 'foot',   lv: 'pēda',    emoji: '🦶', unit: 'body', level: 5, syl: 1, art: 'a' },
  { id: 'leg',    en: 'leg',    lv: 'kāja',    emoji: '🦵', unit: 'body', level: 5, syl: 1, art: 'a' },
  { id: 'tooth',  en: 'tooth',  lv: 'zobs',    emoji: '🦷', unit: 'body', level: 5, syl: 1, art: 'a' },
  { id: 'finger', en: 'finger', lv: 'pirksts', emoji: '👆', unit: 'body', level: 5, syl: 2, art: 'a', alt: '👉' },

  // --- family ------------------------------------------------------------
  { id: 'mom',     en: 'mom',     lv: 'mamma',       emoji: '👩', unit: 'family', level: 2, syl: 1, art: null },
  { id: 'dad',     en: 'dad',     lv: 'tētis',       emoji: '👨', unit: 'family', level: 2, syl: 1, art: null },
  { id: 'baby',    en: 'baby',    lv: 'mazulis',     emoji: '👶', unit: 'family', level: 2, syl: 2, art: 'a' },
  { id: 'sister',  en: 'sister',  lv: 'māsa',        emoji: '👧', unit: 'family', level: 5, syl: 2, art: 'a' },
  { id: 'brother', en: 'brother', lv: 'brālis',      emoji: '👦', unit: 'family', level: 5, syl: 2, art: 'a' },
  { id: 'grandma', en: 'grandma', lv: 'vecmāmiņa',   emoji: '👵', unit: 'family', level: 5, syl: 2, art: null },
  { id: 'grandpa', en: 'grandpa', lv: 'vectētiņš',   emoji: '👴', unit: 'family', level: 5, syl: 2, art: null },
  { id: 'family',  en: 'family',  lv: 'ģimene',      emoji: '👨‍👩‍👧', unit: 'family', level: 5, syl: 3, art: 'a', alt: '👪' },

  // --- numbers -----------------------------------------------------------
  // Age 5 only, all of them. The picture for a number has to be the digit
  // glyph, and matching a spoken word to a written numeral is a literacy skill
  // a 2-year-old does not have yet — they would be guessing, not learning.
  // (Teaching counting properly needs "three apples" style pictures, which is
  // a job for real illustrations rather than emoji.)
  { id: 'one',   en: 'one',   lv: 'viens',   emoji: '1️⃣', unit: 'numbers', level: 5, syl: 1, art: null, noPhon: true },
  { id: 'two',   en: 'two',   lv: 'divi',    emoji: '2️⃣', unit: 'numbers', level: 5, syl: 1, art: null, noPhon: true },
  { id: 'three', en: 'three', lv: 'trīs',    emoji: '3️⃣', unit: 'numbers', level: 5, syl: 1, art: null },
  { id: 'four',  en: 'four',  lv: 'četri',   emoji: '4️⃣', unit: 'numbers', level: 5, syl: 1, art: null },
  { id: 'five',  en: 'five',  lv: 'pieci',   emoji: '5️⃣', unit: 'numbers', level: 5, syl: 1, art: null },
  { id: 'six',   en: 'six',   lv: 'seši',    emoji: '6️⃣', unit: 'numbers', level: 5, syl: 1, art: null },
  { id: 'seven', en: 'seven', lv: 'septiņi', emoji: '7️⃣', unit: 'numbers', level: 5, syl: 2, art: null },
  { id: 'eight', en: 'eight', lv: 'astoņi',  emoji: '8️⃣', unit: 'numbers', level: 5, syl: 1, art: null, noPhon: true },
  { id: 'nine',  en: 'nine',  lv: 'deviņi',  emoji: '9️⃣', unit: 'numbers', level: 5, syl: 1, art: null },
  { id: 'ten',   en: 'ten',   lv: 'desmit',  emoji: '🔟', unit: 'numbers', level: 5, syl: 1, art: null },

  // --- toys --------------------------------------------------------------
  { id: 'ball',    en: 'ball',    lv: 'bumba',    emoji: '⚽', unit: 'toys', level: 2, syl: 1, art: 'a', alt: '🏀' },
  { id: 'doll',    en: 'doll',    lv: 'lelle',    emoji: '🪆', unit: 'toys', level: 2, syl: 1, art: 'a' },
  { id: 'teddy',   en: 'teddy',   lv: 'lācītis',  emoji: '🧸', unit: 'toys', level: 2, syl: 2, art: 'a' },
  { id: 'book',    en: 'book',    lv: 'grāmata',  emoji: '📖', unit: 'toys', level: 2, syl: 1, art: 'a', alt: '📕' },
  { id: 'balloon', en: 'balloon', lv: 'balons',   emoji: '🎈', unit: 'toys', level: 2, syl: 2, art: 'a' },
  { id: 'blocks',  en: 'blocks',  lv: 'klucīši',  emoji: '🧱', unit: 'toys', level: 5, syl: 1, art: null },
  { id: 'kite',    en: 'kite',    lv: 'pūķis',    emoji: '🪁', unit: 'toys', level: 5, syl: 1, art: 'a' },
  { id: 'drum',    en: 'drum',    lv: 'bungas',   emoji: '🥁', unit: 'toys', level: 5, syl: 1, art: 'a' },
  { id: 'puzzle',  en: 'puzzle',  lv: 'puzle',    emoji: '🧩', unit: 'toys', level: 5, syl: 2, art: 'a' },

  // --- clothes -----------------------------------------------------------
  { id: 'hat',    en: 'hat',    lv: 'cepure', emoji: '🧢', unit: 'clothes', level: 2, syl: 1, art: 'a', alt: '👒' },
  { id: 'shoes',  en: 'shoes',  lv: 'kurpes', emoji: '👟', unit: 'clothes', level: 2, syl: 1, art: null, alt: '👞' },
  { id: 'socks',  en: 'socks',  lv: 'zeķes',  emoji: '🧦', unit: 'clothes', level: 2, syl: 1, art: null },
  { id: 'shirt',  en: 'shirt',  lv: 'krekls', emoji: '👕', unit: 'clothes', level: 5, syl: 1, art: 'a' },
  { id: 'pants',  en: 'pants',  lv: 'bikses', emoji: '👖', unit: 'clothes', level: 5, syl: 1, art: null },
  { id: 'jacket', en: 'jacket', lv: 'jaka',   emoji: '🧥', unit: 'clothes', level: 5, syl: 2, art: 'a' },
  { id: 'dress',  en: 'dress',  lv: 'kleita', emoji: '👗', unit: 'clothes', level: 5, syl: 1, art: 'a' },
  { id: 'scarf',  en: 'scarf',  lv: 'šalle',  emoji: '🧣', unit: 'clothes', level: 5, syl: 1, art: 'a' },
  { id: 'gloves', en: 'gloves', lv: 'cimdi',  emoji: '🧤', unit: 'clothes', level: 5, syl: 1, art: null },

  // --- home --------------------------------------------------------------
  { id: 'house',  en: 'house',  lv: 'māja',       emoji: '🏠', unit: 'home', level: 2, syl: 1, art: 'a', alt: '🏡' },
  { id: 'door',   en: 'door',   lv: 'durvis',     emoji: '🚪', unit: 'home', level: 2, syl: 1, art: 'a' },
  { id: 'bed',    en: 'bed',    lv: 'gulta',      emoji: '🛏️', unit: 'home', level: 2, syl: 1, art: 'a', alt: '🛌' },
  { id: 'spoon',  en: 'spoon',  lv: 'karote',     emoji: '🥄', unit: 'home', level: 2, syl: 1, art: 'a' },
  { id: 'cup',    en: 'cup',    lv: 'krūze',      emoji: '☕', unit: 'home', level: 2, syl: 1, art: 'a', alt: '🍵' },
  { id: 'chair',  en: 'chair',  lv: 'krēsls',     emoji: '🪑', unit: 'home', level: 5, syl: 1, art: 'a' },
  { id: 'table',  en: 'table',  lv: 'galds',      emoji: '🍽️', unit: 'home', level: 5, syl: 2, art: 'a' },
  { id: 'window', en: 'window', lv: 'logs',       emoji: '🪟', unit: 'home', level: 5, syl: 2, art: 'a' },
  { id: 'key',    en: 'key',    lv: 'atslēga',    emoji: '🔑', unit: 'home', level: 5, syl: 1, art: 'a', alt: '🗝️' },
  { id: 'lamp',   en: 'lamp',   lv: 'lampa',      emoji: '💡', unit: 'home', level: 5, syl: 1, art: 'a', alt: '🪔' },
  { id: 'clock',  en: 'clock',  lv: 'pulkstenis', emoji: '🕐', unit: 'home', level: 5, syl: 1, art: 'a', alt: '⏰' },

  // --- vehicles ----------------------------------------------------------
  { id: 'car',     en: 'car',     lv: 'mašīna',        emoji: '🚗', unit: 'vehicles', level: 2, syl: 1, art: 'a', alt: '🚙' },
  { id: 'bus',     en: 'bus',     lv: 'autobuss',      emoji: '🚌', unit: 'vehicles', level: 2, syl: 1, art: 'a', alt: '🚍' },
  { id: 'train',   en: 'train',   lv: 'vilciens',      emoji: '🚂', unit: 'vehicles', level: 2, syl: 1, art: 'a', alt: '🚆' },
  { id: 'plane',   en: 'plane',   lv: 'lidmašīna',     emoji: '✈️', unit: 'vehicles', level: 2, syl: 1, art: 'a', alt: '🛩️' },
  { id: 'bike',    en: 'bike',    lv: 'velosipēds',    emoji: '🚲', unit: 'vehicles', level: 2, syl: 1, art: 'a', alt: '🚴' },
  { id: 'boat',    en: 'boat',    lv: 'laiva',         emoji: '⛵', unit: 'vehicles', level: 5, syl: 1, art: 'a', alt: '🚤' },
  { id: 'truck',   en: 'truck',   lv: 'kravas mašīna', emoji: '🚚', unit: 'vehicles', level: 5, syl: 1, art: 'a', alt: '🚛' },
  { id: 'tractor', en: 'tractor', lv: 'traktors',      emoji: '🚜', unit: 'vehicles', level: 5, syl: 2, art: 'a' },

  // --- nature ------------------------------------------------------------
  { id: 'sun',    en: 'sun',    lv: 'saule',    emoji: '☀️', unit: 'nature', level: 2, syl: 1, art: 'a', alt: '🌞' },
  { id: 'moon',   en: 'moon',   lv: 'mēness',   emoji: '🌙', unit: 'nature', level: 2, syl: 1, art: 'a', alt: '🌝' },
  { id: 'star',   en: 'star',   lv: 'zvaigzne', emoji: '⭐', unit: 'nature', level: 2, syl: 1, art: 'a', alt: '🌟' },
  { id: 'tree',   en: 'tree',   lv: 'koks',     emoji: '🌳', unit: 'nature', level: 2, syl: 1, art: 'a', alt: '🌲' },
  { id: 'flower', en: 'flower', lv: 'puķe',     emoji: '🌼', unit: 'nature', level: 2, syl: 2, art: 'a', alt: '🌷' },
  { id: 'rain',   en: 'rain',   lv: 'lietus',   emoji: '🌧️', unit: 'nature', level: 2, syl: 1, art: null, alt: '☔' },
  { id: 'snow',   en: 'snow',   lv: 'sniegs',   emoji: '❄️', unit: 'nature', level: 2, syl: 1, art: null, alt: '🌨️' },
  { id: 'cloud',  en: 'cloud',  lv: 'mākonis',  emoji: '☁️', unit: 'nature', level: 5, syl: 1, art: 'a', alt: '🌥️' },
  { id: 'wind',   en: 'wind',   lv: 'vējš',     emoji: '🌬️', unit: 'nature', level: 5, syl: 1, art: null },
  { id: 'leaf',   en: 'leaf',   lv: 'lapa',     emoji: '🍃', unit: 'nature', level: 5, syl: 1, art: 'a', alt: '🍂' },
  { id: 'stone',  en: 'stone',  lv: 'akmens',   emoji: '🪨', unit: 'nature', level: 5, syl: 1, art: 'a' },

  // --- actions -----------------------------------------------------------
  // `tpr` marks words the child can physically act out — these drive the
  // movement break, which is where verbs actually stick at this age.
  { id: 'jump',  en: 'jump',  lv: 'lēkt',           emoji: '🦘', unit: 'actions', level: 2, syl: 1, art: null, tpr: true, alt: '⛹️' },
  { id: 'run',   en: 'run',   lv: 'skriet',         emoji: '🏃', unit: 'actions', level: 2, syl: 1, art: null, tpr: true, alt: '🏃‍♀️' },
  { id: 'clap',  en: 'clap',  lv: 'plaukšķināt',    emoji: '👏', unit: 'actions', level: 2, syl: 1, art: null, tpr: true },
  { id: 'dance', en: 'dance', lv: 'dejot',          emoji: '💃', unit: 'actions', level: 2, syl: 1, art: null, tpr: true, alt: '🕺' },
  { id: 'eat',   en: 'eat',   lv: 'ēst',            emoji: '😋', unit: 'actions', level: 2, syl: 1, art: null, tpr: true },
  { id: 'drink', en: 'drink', lv: 'dzert',          emoji: '🥤', unit: 'actions', level: 2, syl: 1, art: null, tpr: true },
  { id: 'sleep', en: 'sleep', lv: 'gulēt',          emoji: '😴', unit: 'actions', level: 2, syl: 1, art: null, tpr: true, alt: '💤' },
  { id: 'sing',  en: 'sing',  lv: 'dziedāt',        emoji: '🎤', unit: 'actions', level: 5, syl: 1, art: null, tpr: true, alt: '🎶' },
  { id: 'swim',  en: 'swim',  lv: 'peldēt',         emoji: '🏊', unit: 'actions', level: 5, syl: 1, art: null, tpr: true, alt: '🏊‍♀️' },
  { id: 'walk',  en: 'walk',  lv: 'iet',            emoji: '🚶', unit: 'actions', level: 5, syl: 1, art: null, tpr: true, alt: '🚶‍♀️' },
  { id: 'read',  en: 'read',  lv: 'lasīt',          emoji: '📚', unit: 'actions', level: 5, syl: 1, art: null },
  { id: 'wash',  en: 'wash',  lv: 'mazgāt',         emoji: '🧼', unit: 'actions', level: 5, syl: 1, art: null, tpr: true, alt: '🚿' },

  // --- feelings ----------------------------------------------------------
  // The feelings all share the "face" look group. For a five-year-old, telling
  // 😄 from 😢 is exactly the skill; for a toddler it is a second hard task on
  // top of the vocabulary, so the selector keeps them out of each other's
  // answer choices at age 2.
  { id: 'happy',  en: 'happy',  lv: 'priecīgs',   emoji: '😄', unit: 'feelings', level: 2, syl: 2, art: null, look: 'face', alt: '😃' },
  { id: 'sad',    en: 'sad',    lv: 'skumjš',     emoji: '😢', unit: 'feelings', level: 2, syl: 1, art: null, look: 'face', alt: '😭' },
  { id: 'love',   en: 'love',   lv: 'mīlestība',  emoji: '❤️', unit: 'feelings', level: 2, syl: 1, art: null, alt: '💖' },
  { id: 'angry',  en: 'angry',  lv: 'dusmīgs',    emoji: '😠', unit: 'feelings', level: 5, syl: 2, art: null, look: 'face', alt: '😡' },
  { id: 'tired',  en: 'tired',  lv: 'noguris',    emoji: '🥱', unit: 'feelings', level: 5, syl: 2, art: null, look: 'face', alt: '😪' },
  { id: 'hungry', en: 'hungry', lv: 'izsalcis',   emoji: '🤤', unit: 'feelings', level: 5, syl: 2, art: null, look: 'face' },
  { id: 'scared', en: 'scared', lv: 'nobijies',   emoji: '😨', unit: 'feelings', level: 5, syl: 1, art: null, look: 'face', alt: '😱' },
  { id: 'funny',  en: 'funny',  lv: 'smieklīgs',  emoji: '🤣', unit: 'feelings', level: 5, syl: 2, art: null, look: 'face', alt: '😂' },
];

export const WORDS = Object.freeze(W.map(Object.freeze));

const index = new Map(WORDS.map((w) => [w.id, w]));

/** @returns {object|null} */
export const getWord = (id) => index.get(id) || null;

export const wordsInUnit = (unitId) => WORDS.filter((w) => w.unit === unitId);

/** Words a child of this age band is allowed to meet. */
export const wordsForLevel = (level) => WORDS.filter((w) => w.level <= level);

/** Words the child can physically act out, for the TPR movement break. */
export const tprWords = (level) => WORDS.filter((w) => w.tpr && w.level <= level);

/** Words that have a second picture, so a transfer check is possible. */
export const transferableWords = (level) =>
  WORDS.filter((w) => w.alt && w.level <= level);

/**
 * The picture to show for a word.
 * @param {object} word
 * @param {boolean} [useAlt] - show the alternate picture (a transfer check)
 */
export function pictureOf(word, useAlt = false) {
  return useAlt && word.alt
    ? { id: `${word.id}__alt`, emoji: word.alt, en: word.en }
    : word;
}

/** Initial letter used by the phonics activity; null when spelling misleads. */
export function initialLetter(word) {
  if (word.noPhon) return null;
  const ch = word.en[0].toLowerCase();
  return /[a-z]/.test(ch) ? ch : null;
}

/** "a cat" / "an apple" / "milk" — used by the sentence-frame activity. */
export function withArticle(word) {
  return word.art ? `${word.art} ${word.en}` : word.en;
}
