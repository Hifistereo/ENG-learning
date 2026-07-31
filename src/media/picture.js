// Pictures for words.
//
// Emoji do the job today: they are colourful, instantly readable by a
// pre-literate child, need no files, no licensing, and work offline. The one
// weakness is abstract words, which is why the curriculum front-loads
// concrete nouns.
//
// Drop `assets/img/cat.webp` in and list "cat" in the manifest and every
// screen shows it instead — this is the only module that decides where a
// word's picture comes from. See media/art.js and assets/BRIEF.md.

import { hasArt, artUrl, preloadArt } from './art.js';
import { el } from '../ui/dom.js';

export { preloadArt as preloadPictures };

export const hasImage = (id) => hasArt(id);

/**
 * A picture element for a word (or anything with `id` + `emoji`).
 * @param {{id: string, emoji: string, en?: string}} item
 * @param {{size?: string, className?: string}} [opts]
 */
export function pictureEl(item, opts = {}) {
  const { size = 'var(--pic-size)', className = '' } = opts;

  if (hasArt(item.id)) {
    return el('img', {
      class: `picture picture--img ${className}`,
      src: artUrl(item.id),
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
