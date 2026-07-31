// Story scene backgrounds.
//
// Same swappable pattern as word pictures: the app draws a gradient-and-emoji
// scene by default, and uses real artwork the moment a file exists at the
// expected path. Nothing in the story code knows which it got.
//
//   assets/img/scenes/<mood>.webp      a full scene background
//   assets/img/heroes/<heroId>.webp    the story character
//
// List whatever is added in assets/img/manifest.json (ids prefixed
// "scene:" and "hero:"). assets/BRIEF.md describes each one.

import { el } from '../ui/dom.js';
import { loadManifest } from './manifest.js';
import { MOODS } from '../data/stories.js';

const IMG_DIR = './assets/img/';
let available = new Set();

export async function preloadScenes() {
  available = await loadManifest(`${IMG_DIR}manifest.json`);
  return available;
}

export const hasScene = (mood) => available.has(`scene:${mood}`);
export const hasHero = (heroId) => available.has(`hero:${heroId}`);

/**
 * The backdrop for a scene.
 * @param {string} mood - key into MOODS
 */
export function sceneEl(mood) {
  const treatment = MOODS[mood] || MOODS.home;

  if (hasScene(mood)) {
    return el('div', {
      class: `scene scene--${mood} scene--art`,
      style: { backgroundImage: `url("${IMG_DIR}scenes/${encodeURIComponent(mood)}.webp")` },
      'aria-hidden': 'true',
    });
  }

  // Drawn scene: a sky gradient plus a single large motif. Deliberately plain
  // — a busy background competes with the thing the child is meant to look at.
  return el('div', {
    class: `scene scene--${mood}`,
    style: { background: `linear-gradient(180deg, ${treatment.sky[0]}, ${treatment.sky[1]})` },
    'aria-hidden': 'true',
  }, [
    el('span.scene__motif', { text: treatment.emoji }),
  ]);
}

/** The story's character. */
export function heroEl(hero, { size = 'clamp(3.5rem, 15vw, 6rem)' } = {}) {
  if (hasHero(hero.id)) {
    return el('img', {
      class: 'hero hero--art',
      src: `${IMG_DIR}heroes/${encodeURIComponent(hero.id)}.webp`,
      alt: '',
      style: { width: size, height: size },
    });
  }
  return el('span.hero', {
    'aria-hidden': 'true',
    style: { fontSize: size },
    text: hero.emoji,
  });
}
