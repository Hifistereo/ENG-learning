// Achievement card rendering.
//
// Locked cards are shown, not hidden: a visible goal ("play seven days in a
// row") is what makes a collection motivating. A hidden one is just a
// surprise, which motivates nothing.

import { el, animateOnce } from './dom.js';
import { formatDate, t } from '../i18n/lv.js';

/**
 * @param {{card: object, unlocked: boolean, unlockedAt: number|null}} entry
 * @param {{compact?: boolean}} [opts]
 */
export function achievementCard(entry, { compact = false } = {}) {
  const { card, unlocked, unlockedAt } = entry;

  return el('div.card', {
    dataset: { tier: card.tier, state: unlocked ? 'unlocked' : 'locked' },
    class: compact ? 'card--compact' : '',
  }, [
    el('div.card__medal', { 'aria-hidden': 'true', text: unlocked ? card.emoji : '🔒' }),
    el('div.card__body', {}, [
      el('span.card__title', { text: card.title }),
      el('span.card__sub', {
        text: unlocked
          ? (unlockedAt ? t('tro.earned', { date: formatDate(unlockedAt) }) : '')
          : card.hint,
      }),
    ]),
  ]);
}

/**
 * The card-flip used when a card is unlocked on the celebration screen.
 *
 * The node must be in the document before the animation starts — a detached
 * element never runs CSS animations, so animating first would silently skip
 * the flip and just wait out the fallback timer.
 *
 * @param {object} entry
 * @param {HTMLElement} parent - where the card lands
 */
export async function revealCard(entry, parent) {
  const node = achievementCard(entry);
  node.classList.add('card--reveal');
  parent.append(node);
  await animateOnce(node, 'is-flipping', 1400);
  return node;
}

/** Grid of every card, for the trophy screen and the parent page. */
export function achievementGrid(entries, opts = {}) {
  return el('div.cards', {}, entries.map((entry) => achievementCard(entry, opts)));
}

/** "7 no 26" progress line. */
export function achievementProgress(entries) {
  const unlocked = entries.filter((e) => e.unlocked).length;
  const bar = el('div.cards__bar', {}, [
    el('div.cards__barfill', { style: { width: `${(unlocked / entries.length) * 100}%` } }),
  ]);
  return el('div.cards__progress', {}, [
    el('span', { text: t('tro.progress', { n: unlocked, total: entries.length }) }),
    bar,
  ]);
}
