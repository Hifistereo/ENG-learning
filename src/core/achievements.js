// The achievement engine.
//
// Stateless and retroactive by design: every card in the catalogue is
// re-evaluated against the child's whole history after each session, and any
// card whose condition holds but which is not yet recorded as unlocked is
// awarded now.
//
// That single property is what makes "we'll add more cards later" free. Ship a
// new card in v0.4 and a child who passed its threshold in v0.1 unlocks it the
// next time they play, with no migration and no backfill script. The cost is
// re-running ~25 cheap predicates once per session, which is nothing.
//
// The counterpart obligation lives in data/achievements.js: conditions must be
// monotonic, so a card can never un-earn itself.

import { CARDS, getCard } from '../data/achievements.js';
import { snapshot } from './stats.js';

/**
 * Which cards the child qualifies for right now, ignoring what is already held.
 * @returns {string[]} card ids
 */
export function qualifyingCards(snap) {
  const earned = [];
  for (const card of CARDS) {
    try {
      if (card.test(snap)) earned.push(card.id);
    } catch (err) {
      // A broken condition must never take a session's celebration down with
      // it — skip the card and keep going.
      console.error(`achievement "${card.id}" threw`, err);
    }
  }
  return earned;
}

/**
 * Cards newly earned: qualifying, minus those already unlocked.
 * @param {object} progress
 * @param {object} profile
 * @param {number} [now]
 * @returns {string[]}
 */
export function newlyEarned(progress, profile, now = Date.now()) {
  const snap = snapshot(progress, profile, now);
  const held = progress.achievements || {};
  return qualifyingCards(snap).filter((id) => !held[id]);
}

/** Pet accessories granted by a set of cards, de-duplicated. */
export function rewardsFor(cardIds) {
  const accessories = new Set();
  for (const id of cardIds) {
    const reward = getCard(id)?.reward;
    if (reward?.type === 'petAccessory') accessories.add(reward.id);
  }
  return { accessories: [...accessories] };
}

/**
 * Everything the trophy screen needs: each card plus whether and when it was
 * unlocked, in catalogue order so the collection never reshuffles.
 */
export function collection(progress) {
  const held = progress.achievements || {};
  return CARDS.map((card) => ({
    card,
    unlocked: !!held[card.id],
    unlockedAt: held[card.id] || null,
  }));
}

export function unlockedCount(progress) {
  return Object.keys(progress.achievements || {}).length;
}
