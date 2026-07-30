// Tiny DOM helpers. We build UI with functions instead of template strings so
// that nothing user-entered (child names, pet names) can ever be interpreted
// as markup.

/**
 * Create an element.
 * @param {string} tag - tag name, optionally with .classes (e.g. 'div.card.big')
 * @param {object} [attrs] - properties/attributes. `class`, `text`, `html`,
 *   `dataset`, `style` and `on` (event map) get special handling.
 * @param {Array|Node|string} [children]
 */
export function el(tag, attrs = {}, children = []) {
  const [name, ...classes] = tag.split('.');
  const node = document.createElement(name || 'div');
  if (classes.length) node.classList.add(...classes);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.classList.add(...String(value).split(/\s+/).filter(Boolean));
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'html') node.innerHTML = value;           // only ever called with our own literals
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style') Object.assign(node.style, value);
    else if (key === 'on') for (const [ev, fn] of Object.entries(value)) node.addEventListener(ev, fn);
    else if (key in node && key !== 'list') node[key] = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function mount(root, ...nodes) {
  clear(root).append(...nodes);
  return root;
}

/** Promise that resolves after `ms`, used to pace activity feedback. */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** True when the user has asked the OS to reduce motion. */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Run a one-shot CSS animation class and resolve when it ends.
 * Falls back to a timeout so a missing animation can never wedge a session.
 */
export function animateOnce(node, className, fallbackMs = 800) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      node.classList.remove(className);
      node.removeEventListener('animationend', finish);
      resolve();
    };
    node.addEventListener('animationend', finish);
    node.classList.add(className);
    setTimeout(finish, fallbackMs);
  });
}
