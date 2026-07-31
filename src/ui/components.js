// Shared kid-screen building blocks.
//
// Everything here obeys two rules that come from the ages we are building for:
//   - a tap target is never smaller than --tap-min (112px for toddlers)
//   - nothing is ever marked wrong in red; the pet delivers feedback instead

import { el, clear, prefersReducedMotion } from './dom.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';

/**
 * Standard kid screen: a way out, then the activity stage.
 *
 * There is deliberately no progress bar. A bar that creeps across the top of
 * the screen is read by a small child as a timer — something is running out —
 * and it frames the session as a quantity to get through rather than a place
 * to be. It also made the top of every screen look like a form. The session
 * ends when it ends; the child finds out by the pet waving goodbye.
 */
export function kidScreen({ onQuit = null } = {}) {
  const bar = el('div.topbar');

  if (onQuit) {
    bar.append(el('button.iconbtn', {
      type: 'button',
      'aria-label': t('btn.back'),
      on: { click: onQuit },
    }, '✕'));
  }

  const stage = el('div.stage');
  const root = el('div.screen.screen--kid', {}, [bar, stage]);

  return { root, stage };
}

// The answer grid, the instruction line and the big single card used to live
// here. They are gone: every round now renders into the persistent scene, and
// the shelf in ui/sceneStage.js returns the same handle shape the grid did.
// Keeping a second, unused way to draw a question was how the two would have
// drifted apart.

/** The Latvian translation hint. Opt-in per tap — never shown automatically. */
export function lvHintButton(word) {
  const label = el('span.hint__value', { text: '' });
  const button = el('button.hint', {
    type: 'button',
    on: {
      click: () => {
        label.textContent = label.textContent ? '' : word.lv;
      },
    },
  }, [el('span', { text: `🇱🇻 ${t('act.hintLv')}` }), label]);
  return button;
}

export function primaryButton(label, onClick, { emoji = null } = {}) {
  return el('button.btn.btn--primary.btn--big', {
    type: 'button',
    on: { click: () => { play('tap'); onClick(); } },
  }, [emoji ? el('span', { text: emoji }) : null, el('span', { text: label })]);
}

/** Confetti burst in the fx layer. Purely decorative, never blocks input. */
export function confetti({ count = 26, emojis = ['⭐', '🎉', '✨', '🌟', '🎊'] } = {}) {
  const layer = document.getElementById('fx-layer');
  if (!layer || prefersReducedMotion()) return;

  for (let i = 0; i < count; i += 1) {
    const piece = el('span.confetti', {
      text: emojis[Math.floor(Math.random() * emojis.length)],
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.35}s`,
        animationDuration: `${1.6 + Math.random() * 1.2}s`,
        fontSize: `${1 + Math.random() * 1.4}rem`,
      },
    });
    layer.append(piece);
    piece.addEventListener('animationend', () => piece.remove(), { once: true });
  }
  setTimeout(() => clear(layer), 4000);
}

/** Full-width heading used by home, trophies and the celebration screen. */
export function title(text, { emoji = null, level = 1 } = {}) {
  return el(`h${level}.title`, {}, [
    emoji ? el('span.title__emoji', { text: emoji }) : null,
    el('span', { text }),
  ]);
}
