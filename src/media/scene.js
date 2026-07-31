// Story scene backgrounds and characters.
//
// Same drop-in pattern as word pictures, reading from the shared registry in
// media/art.js: the app draws a gradient-and-emoji scene by default and uses
// real artwork the moment a file exists. Nothing in the story code knows which
// it got.
//
//   assets/img/scenes/<mood>.webp    manifest id "scene:<mood>"
//   assets/img/heroes/<heroId>.webp  manifest id "hero:<heroId>"

import { el } from '../ui/dom.js';
import { hasArt, artUrl } from './art.js';
import { MOODS } from '../data/stories.js';

export const hasScene = (mood) => hasArt(`scene:${mood}`);
export const hasHero = (heroId) => hasArt(`hero:${heroId}`);

/**
 * The backdrop for a scene.
 * @param {string} mood - key into MOODS
 */
export function sceneEl(mood) {
  const treatment = MOODS[mood] || MOODS.home;

  if (hasScene(mood)) {
    return el('div', {
      class: `scene scene--${mood} scene--art`,
      style: { backgroundImage: `url("${artUrl(`scene:${mood}`)}")` },
      'aria-hidden': 'true',
    });
  }

  // Drawn scene: a sky gradient plus a single large motif, kept low and to one
  // side. Deliberately plain — a busy background competes with the thing the
  // child is meant to look at.
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
      src: artUrl(`hero:${hero.id}`),
      alt: '',
      decoding: 'async',
      style: { width: size, height: size },
    });
  }
  return el('span.hero', {
    'aria-hidden': 'true',
    style: { fontSize: size },
    text: hero.emoji,
  });
}
