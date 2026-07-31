// Entry point: wire routes, mount the pet, start the router.

import { route, setNotFound, startRouter, navigate } from './router.js';
import { getActiveProfile, listProfiles } from './state/profiles.js';
import { mountPet, showPet } from './pet/pet.js';
import { preloadArt } from './media/art.js';
import { unlockAudio } from './media/speech.js';
import { unlockSfx } from './media/sfx.js';
import { APP_VERSION } from './version.js';

import * as home from './ui/screens/home.js';
import * as onboarding from './ui/screens/onboarding.js';
import * as play from './ui/screens/play.js';
import * as trophies from './ui/screens/trophies.js';
import * as parent from './ui/screens/parent.js';

// Browsers only let audio start inside a real user gesture. Catch the very
// first tap anywhere and prime both audio paths, so the first word a child
// triggers actually makes a sound.
function primeAudioOnFirstGesture() {
  const prime = () => {
    unlockAudio();
    unlockSfx();
    window.removeEventListener('pointerdown', prime);
    window.removeEventListener('keydown', prime);
  };
  window.addEventListener('pointerdown', prime, { once: true });
  window.addEventListener('keydown', prime, { once: true });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Relative path: the app is served from a repository subpath on Pages, so
  // an absolute '/sw.js' would 404.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('service worker registration failed', err);
    });
  });
}

function boot() {
  console.info(`Mācāmies angliski v${APP_VERSION}`);

  mountPet(document.getElementById('pet-layer'), getActiveProfile());
  preloadArt();
  primeAudioOnFirstGesture();
  registerServiceWorker();

  route('/', (root) => {
    // No profiles yet: the first thing anyone sees is onboarding.
    if (!listProfiles().length) return navigate('/welcome', { replace: true });
    return home.render(root);
  });
  route('/welcome', (root) => onboarding.render(root));
  route('/play', (root) => play.render(root));
  route('/trophies', (root) => trophies.render(root));
  route('/parent', (root) => {
    showPet(false);
    return parent.render(root);
  });

  setNotFound(() => navigate('/', { replace: true }));

  startRouter();
}

boot();
