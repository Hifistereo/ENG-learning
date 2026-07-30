// Shared kid-screen building blocks.
//
// Everything here obeys two rules that come from the ages we are building for:
//   - a tap target is never smaller than --tap-min (112px for toddlers)
//   - nothing is ever marked wrong in red; the pet delivers feedback instead

import { el, clear, wait, prefersReducedMotion } from './dom.js';
import { pictureEl } from '../media/picture.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';

/** Standard kid screen: a slim top bar, then the activity stage. */
export function kidScreen({ onQuit = null, fraction = null } = {}) {
  const bar = el('div.topbar');

  if (onQuit) {
    bar.append(el('button.iconbtn', {
      type: 'button',
      'aria-label': t('btn.back'),
      on: { click: onQuit },
    }, '✕'));
  }

  const track = el('div.progress');
  const fill = el('div.progress__fill');
  track.append(fill);
  bar.append(track);

  const stage = el('div.stage');
  const root = el('div.screen.screen--kid', {}, [bar, stage]);

  if (fraction !== null) fill.style.width = `${Math.round(fraction * 100)}%`;

  return {
    root,
    stage,
    setProgress(f) { fill.style.width = `${Math.round(Math.max(0, Math.min(1, f)) * 100)}%`; },
  };
}

/** The instruction line at the top of an activity. */
export function prompt(text, { onReplay = null } = {}) {
  const row = el('div.prompt', {}, [el('span.prompt__text', { text })]);
  if (onReplay) {
    row.append(el('button.iconbtn.iconbtn--round', {
      type: 'button',
      'aria-label': t('act.listenAgain'),
      on: { click: onReplay },
    }, '🔊'));
  }
  return row;
}

/**
 * The answer grid.
 *
 * Returns handles rather than raw DOM so activities can express feedback as
 * intent ("that one was right") instead of poking at classes.
 *
 * @param {object[]} options - word objects
 * @param {object} cfg
 * @param {number} cfg.ageBand
 * @param {boolean} [cfg.showText] - print the English word under the picture (age 5)
 * @param {(word: object, index: number) => void} cfg.onPick
 */
export function choiceGrid(options, { ageBand = 5, showText = false, onPick }) {
  const grid = el('div.choices', { dataset: { count: String(options.length) } });
  const buttons = [];
  let locked = false;

  options.forEach((word, index) => {
    const button = el('button.choice', {
      type: 'button',
      'aria-label': word.en,
      dataset: { id: word.id },
      on: {
        click: () => {
          if (locked) return;
          play('tap');
          onPick(word, index);
        },
      },
    }, [
      pictureEl(word, { className: 'choice__pic' }),
      showText ? el('span.choice__word', { text: word.en }) : null,
    ]);
    buttons.push(button);
    grid.append(button);
  });

  return {
    root: grid,
    lock() { locked = true; },
    unlock() { locked = false; },

    /** Celebrate the right answer. */
    async markCorrect(wordId) {
      const button = buttons.find((b) => b.dataset.id === wordId);
      if (!button) return;
      button.classList.add('is-correct');
      buttons.filter((b) => b !== button).forEach((b) => b.classList.add('is-dimmed'));
      await wait(prefersReducedMotion() ? 300 : 900);
    },

    /**
     * Wrong tap: the option fades back rather than being crossed out, and the
     * correct answer stays available. Nothing is lost, so there is nothing to
     * be upset about.
     */
    async markWrong(wordId) {
      const button = buttons.find((b) => b.dataset.id === wordId);
      if (!button) return;
      button.classList.add('is-wrong');
      await wait(prefersReducedMotion() ? 200 : 650);
      button.classList.remove('is-wrong');
      button.classList.add('is-out');
    },

    /** Nudge the correct answer after repeated misses. */
    hint(wordId) {
      buttons.find((b) => b.dataset.id === wordId)?.classList.add('is-hinted');
    },

    /** Which side of the screen the answer is on, for the pet's pointing hint. */
    directionOf(wordId) {
      const index = buttons.findIndex((b) => b.dataset.id === wordId);
      if (index === -1) return null;
      return index % 2 === 0 ? 'left' : 'right';
    },
  };
}

/** A single large picture, used for introductions and say-it. */
export function bigCard(word, { showText = true, onTap = null } = {}) {
  const card = el(onTap ? 'button.bigcard' : 'div.bigcard', {
    type: onTap ? 'button' : null,
    on: onTap ? { click: onTap } : {},
  }, [
    pictureEl(word, { size: 'clamp(8rem, 34vw, 15rem)', className: 'bigcard__pic' }),
    showText ? el('span.bigcard__word', { text: word.en }) : null,
  ]);
  return card;
}

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
