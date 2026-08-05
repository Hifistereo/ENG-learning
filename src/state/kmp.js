// The shared KidMindPath profile, as seen from this app.
//
// shared/kmp.js is a classic script that sets window.KMP; this module is the
// only place that touches it, so the rest of the app never has to think about
// whether the hub exists.
//
// It very often does not. This app is also served from
// hifistereo.github.io/ENG-learning/ — a different origin with no kmp:* at all
// — and from a plain file server during development. Every function here
// returns a safe default in that case, and none of them throw. The rule is the
// same one storage.js already follows: a missing hub degrades to "this app on
// its own", never to a blank screen.

const api = () => {
  try {
    const k = globalThis.KMP;
    return k && typeof k.activeChild === 'function' ? k : null;
  } catch {
    return null;
  }
};

/** True when running under the hub at all. */
export const hasHub = () => api() !== null;

/**
 * The child chosen on kidmindpath.com, or null.
 *
 * A guest counts as null on purpose: a guest has no name to prefill and no
 * identity worth adopting an existing profile into, so this app should just
 * run its own onboarding.
 */
export function hubChild() {
  try {
    const child = api()?.activeChild();
    if (!child || child.guest || !child.id) return null;
    return { id: child.id, name: child.name || '', ageYears: child.ageYears ?? null };
  } catch {
    return null;
  }
}

/** This app's own age band (2 | 5) from the shared age, or null if unknown. */
export function hubAgeBand() {
  try {
    const band = api()?.ageBand('eng');
    return band === 2 || band === 5 ? band : null;
  } catch {
    return null;
  }
}

/** Global sound / reduced motion, or null when the hub has no opinion. */
export function hubPrefs() {
  try {
    return api()?.prefs() ?? null;
  } catch {
    return null;
  }
}

/** Inject the bar back to the hub. No-op without a hub. */
export function mountHomeBar(opts = {}) {
  try {
    api()?.homeBar({ appId: 'ENG-learning', title: 'Mācāmies angliski!', ...opts });
  } catch {
    // The bar is chrome. Losing it must never stop the game from starting.
  }
}
