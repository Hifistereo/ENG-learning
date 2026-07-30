// Pictures for words and pets.
//
// Emoji do the job today: they are colourful, instantly readable by a
// pre-literate child, need no files, no licensing, and work offline. The one
// weakness is abstract words, which is why the curriculum front-loads
// concrete nouns.
//
// If real illustrations are ever added, drop them in assets/img/, list the
// ids in assets/img/manifest.json, and every screen picks them up — this is
// the only module that knows where a picture comes from.

import { loadManifest } from './manifest.js';
import { el } from '../ui/dom.js';

const IMG_DIR = './assets/img/';
const IMG_MANIFEST = `${IMG_DIR}manifest.json`;

let available = new Set();

/** Warm the manifest once at startup so renders stay synchronous. */
export async function preloadPictures() {
  available = await loadManifest(IMG_MANIFEST);
  return available;
}

export const hasImage = (id) => available.has(id);

/**
 * A picture element for a word (or anything with `id` + `emoji`).
 * @param {{id: string, emoji: string, en?: string}} item
 * @param {{size?: string, className?: string}} [opts]
 */
export function pictureEl(item, opts = {}) {
  const { size = 'var(--pic-size)', className = '' } = opts;

  if (hasImage(item.id)) {
    return el('img', {
      class: `picture picture--img ${className}`,
      src: `${IMG_DIR}${encodeURIComponent(item.id)}.webp`,
      alt: '',
      loading: 'eager',
      decoding: 'async',
      style: { width: size, height: size },
    });
  }

  // aria-hidden: the picture is decorative here. The word itself is announced
  // by the surrounding button's label, so a screen reader must not read out
  // the emoji's name (which would leak the answer in English or the OS
  // language).
  return el('span', {
    class: `picture picture--emoji ${className}`,
    'aria-hidden': 'true',
    style: { fontSize: size, lineHeight: '1' },
    text: item.emoji || '❓',
  });
}
