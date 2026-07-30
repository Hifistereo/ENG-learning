// Sentence frames for age 5.
//
// Research-backed reason these exist: single words plateau fast. A fixed frame
// with one swappable slot ("I see a ___") lets a child produce a whole English
// sentence while only having to retrieve one word, which is how early
// production actually gets off the ground.
//
// `units` lists which vocabulary units can fill the slot. `article` says
// whether the slot word takes a/an.

export const FRAMES = [
  {
    id: 'i_see',
    pattern: 'I see ___',
    lv: 'Es redzu ___',
    units: ['animals', 'vehicles', 'nature', 'toys'],
    article: true,
  },
  {
    id: 'i_like',
    pattern: 'I like ___',
    lv: 'Man garšo ___',
    units: ['food'],
    article: false,
  },
  {
    id: 'i_have',
    pattern: 'I have ___',
    lv: 'Man ir ___',
    units: ['toys', 'clothes'],
    article: true,
  },
  {
    id: 'it_is',
    pattern: 'It is ___',
    lv: 'Tas ir ___',
    units: ['colors'],
    article: false,
  },
  {
    id: 'i_am',
    pattern: 'I am ___',
    lv: 'Es esmu ___',
    units: ['feelings'],
    article: false,
  },
  {
    id: 'i_can',
    pattern: 'I can ___',
    lv: 'Es protu ___',
    units: ['actions'],
    article: false,
  },
  {
    id: 'this_is_my',
    pattern: 'This is my ___',
    lv: 'Šis ir mans ___',
    units: ['family', 'body'],
    article: false,
  },
];

const byId = new Map(FRAMES.map((f) => [f.id, f]));

export const getFrame = (id) => byId.get(id) || null;

/** Frames whose slot can be filled from the words the child already knows. */
export function framesForWords(words) {
  const units = new Set(words.map((w) => w.unit));
  return FRAMES.filter((f) => f.units.some((u) => units.has(u)));
}

/** Build the spoken/written sentence for a frame + word. */
export function renderFrame(frame, word) {
  const slot = frame.article && word.art ? `${word.art} ${word.en}` : word.en;
  return frame.pattern.replace('___', slot);
}
