// Optional drop-in asset manifests.
//
// The app ships with no recordings and no photos — emoji and speech synthesis
// cover everything. But we want dropping in real assets later to require zero
// code changes, so each asset folder may contain a manifest.json listing what
// is available:
//
//   assets/audio/en/manifest.json   ["cat", "dog", ...]
//   assets/img/manifest.json        ["cat", "dog", ...]
//
// A manifest is fetched once. If it 404s (the normal case today) we remember
// that and never ask again — no per-word 404 storm.

const cache = new Map();

/**
 * @param {string} url
 * @returns {Promise<Set<string>>} the listed ids, or an empty set
 */
export function loadManifest(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = fetch(url, { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : []))
    .then((list) => new Set(Array.isArray(list) ? list : []))
    .catch(() => new Set());
  cache.set(url, promise);
  return promise;
}
