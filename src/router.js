// Hash router. Hash-based (not History API) because GitHub Pages serves this
// from a subpath with no server-side rewrite, so deep links must not hit the
// server at all.

const routes = new Map();
let currentCleanup = null;
let notFoundHandler = null;

/**
 * @param {string} path - e.g. '/', '/play', '/parent'
 * @param {(mount: HTMLElement, params: URLSearchParams) => (void|Function|Promise<void|Function>)} render
 *   May return a cleanup function, which runs before the next route renders.
 */
export function route(path, render) {
  routes.set(path, render);
}

export function setNotFound(render) {
  notFoundHandler = render;
}

export function navigate(path, { replace = false } = {}) {
  const hash = `#${path}`;
  if (location.hash === hash) return resolve();
  if (replace) location.replace(hash);
  else location.hash = hash;
}

export function currentPath() {
  const raw = location.hash.replace(/^#/, '') || '/';
  return raw.split('?')[0] || '/';
}

async function resolve() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const render = routes.get(path || '/') || notFoundHandler;
  if (!render) return;

  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch (err) { console.error('route cleanup failed', err); }
  }
  currentCleanup = null;

  const mountEl = document.getElementById('app');
  mountEl.scrollTop = 0;

  // Decorative effects belong to the screen that started them. Without this,
  // confetti from a celebration keeps raining over the parent statistics.
  const fx = document.getElementById('fx-layer');
  while (fx?.firstChild) fx.removeChild(fx.firstChild);

  try {
    const cleanup = await render(mountEl, new URLSearchParams(query));
    if (typeof cleanup === 'function') currentCleanup = cleanup;
  } catch (err) {
    console.error('route render failed', err);
    mountEl.textContent = 'Kaut kas nogāja greizi. Pārlādē lapu.';
  }
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
