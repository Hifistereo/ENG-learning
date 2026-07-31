// Service worker: makes the app work with no connection at all.
//
// The cache name carries the app version, so bumping APP_VERSION in
// src/version.js is all it takes to retire the old cache and ship an update.
// Keep the version here in step with src/version.js — a service worker cannot
// import an ES module, so this is the one place the number is duplicated.

const VERSION = '0.3.0';
const CACHE = `engl-v${VERSION}`;

// Everything needed for a full session offline. All paths are relative: the
// app is served from a repository subpath on GitHub Pages.
const ASSETS = [
  // Shell
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './assets/audio/en/manifest.json',
  './assets/img/manifest.json',

  // Styles
  './styles/base.css',
  './styles/cards.css',
  './styles/enact.css',
  './styles/kid.css',
  './styles/parent.css',
  './styles/pet.css',
  './styles/tokens.css',

  // Modules
  './src/activities/base.js',
  './src/activities/chant.js',
  './src/activities/coplay.js',
  './src/activities/doAction.js',
  './src/activities/farewell.js',
  './src/activities/index.js',
  './src/activities/intro.js',
  './src/activities/listenTap.js',
  './src/activities/order.js',
  './src/activities/phonics.js',
  './src/activities/sentence.js',
  './src/activities/story.js',
  './src/activities/teach.js',
  './src/activities/transfer.js',
  './src/core/achievements.js',
  './src/core/knowledge.js',
  './src/core/selector.js',
  './src/core/session.js',
  './src/core/srs.js',
  './src/core/stats.js',
  './src/core/storyBuilder.js',
  './src/core/time.js',
  './src/data/achievements.js',
  './src/data/chatter.js',
  './src/data/pets.js',
  './src/data/phrases.js',
  './src/data/stories.js',
  './src/data/units.js',
  './src/data/words.js',
  './src/i18n/lv.js',
  './src/main.js',
  './src/media/art.js',
  './src/media/enact.js',
  './src/media/manifest.js',
  './src/media/mic.js',
  './src/media/picture.js',
  './src/media/scene.js',
  './src/media/sfx.js',
  './src/media/speech.js',
  './src/pet/pet.js',
  './src/router.js',
  './src/state/profiles.js',
  './src/state/progress.js',
  './src/state/storage.js',
  './src/ui/achievementCard.js',
  './src/ui/components.js',
  './src/ui/dom.js',
  './src/ui/sceneStage.js',
  './src/ui/screens/charts.js',
  './src/ui/screens/home.js',
  './src/ui/screens/onboarding.js',
  './src/ui/screens/parent.js',
  './src/ui/screens/play.js',
  './src/ui/screens/trophies.js',
  './src/version.js',
];

/**
 * Artwork listed in assets/img/manifest.json, resolved to file paths.
 *
 * Read at install time rather than hard-coded, so adding pictures never means
 * editing this file. Without it, images would only be cached the first time a
 * child happened to see them online — and an installed app opened offline on
 * day one would show emoji for artwork that is sitting right there on disk.
 */
async function artAssets() {
  const folders = { scene: 'scenes', hero: 'heroes', pet: 'pets', char: 'characters' };
  try {
    const res = await fetch('./assets/img/manifest.json', { cache: 'reload' });
    if (!res.ok) return [];
    const ids = await res.json();
    return (Array.isArray(ids) ? ids : []).map((id) => {
      const [prefix, rest] = id.includes(':') ? id.split(':') : [null, id];
      const folder = folders[prefix];
      return folder
        ? `./assets/img/${folder}/${encodeURIComponent(rest)}.webp`
        : `./assets/img/${encodeURIComponent(rest)}.webp`;
    });
  } catch {
    return [];
  }
}

/** Recorded audio, same idea. */
async function audioAssets() {
  try {
    const res = await fetch('./assets/audio/en/manifest.json', { cache: 'reload' });
    if (!res.ok) return [];
    const ids = await res.json();
    return (Array.isArray(ids) ? ids : [])
      .map((id) => `./assets/audio/en/${encodeURIComponent(id)}.mp3`);
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const media = [...(await artAssets()), ...(await audioAssets())];

    // addAll is all-or-nothing; cache entries individually so one missing
    // optional file cannot leave the app without a cache at all.
    await Promise.all([...ASSETS, ...media].map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
        console.warn('[sw] could not cache', url, err);
      })));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('engl-v') && name !== CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;      // we make no cross-origin requests

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });

    // Cache-first: this app has no server-side state, so a cached asset is
    // always as correct as a fetched one, and offline must be the fast path.
    if (cached) {
      // Refresh in the background so the next load picks up any change.
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) (await caches.open(CACHE)).put(request, fresh.clone());
        } catch { /* offline: the cached copy stands */ }
      })());
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
      return response;
    } catch {
      // A navigation that missed the cache still gets the app shell, so a
      // deep link opened offline lands somewhere useful instead of erroring.
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
