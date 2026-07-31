// The single registry of drop-in artwork.
//
// The app ships with no images at all — emoji cover everything. Any file added
// under assets/img/ replaces its emoji automatically, with no code change, as
// long as its id is listed in assets/img/manifest.json.
//
// One module owns the manifest on purpose. It used to be loaded separately by
// the word-picture layer and the scene layer, which meant only whichever one
// startup happened to call actually knew what existed — scene and hero art
// would have sat on disk being ignored.
//
// Manifest ids and where the file lives:
//
//   "cat"                 assets/img/cat.webp                  word picture
//   "cat__alt"            assets/img/cat__alt.webp             second picture
//   "scene:forest"        assets/img/scenes/forest.webp        story background
//   "hero:cat"            assets/img/heroes/cat.webp           story character
//   "pet:dragon"          assets/img/pets/dragon.webp          companion
//   "char:alien"          assets/img/characters/alien.webp     other characters
//
// See assets/BRIEF.md for the full list with sizes and descriptions.

import { loadManifest } from './manifest.js';

const IMG_DIR = './assets/img/';

let available = new Set();

/** Fetch the manifest once at startup. Safe to call more than once. */
export async function preloadArt() {
  available = await loadManifest(`${IMG_DIR}manifest.json`);
  return available;
}

/** @param {string} manifestId e.g. "cat", "scene:forest", "pet:dragon" */
export const hasArt = (manifestId) => available.has(manifestId);

/** How many pieces of artwork are installed — shown on the parent page. */
export const artCount = () => available.size;

/**
 * Turn a manifest id into a file path.
 * The prefix before ':' becomes the folder; a bare id sits at the top level.
 */
export function artUrl(manifestId) {
  const [prefix, rest] = manifestId.includes(':') ? manifestId.split(':') : [null, manifestId];
  const folder = { scene: 'scenes', hero: 'heroes', pet: 'pets', char: 'characters' }[prefix];
  return folder
    ? `${IMG_DIR}${folder}/${encodeURIComponent(rest)}.webp`
    : `${IMG_DIR}${encodeURIComponent(rest)}.webp`;
}

/**
 * An <img> for a piece of art, or null if it is not installed.
 * Callers fall back to their emoji when this returns null.
 */
export function artEl(manifestId, { size = '4rem', className = '' } = {}) {
  if (!hasArt(manifestId)) return null;
  const img = document.createElement('img');
  img.src = artUrl(manifestId);
  img.alt = '';
  img.decoding = 'async';
  img.className = className;
  img.style.width = size;
  img.style.height = size;
  return img;
}

/** Test seam. */
export function _setAvailable(ids) {
  available = new Set(ids);
}
