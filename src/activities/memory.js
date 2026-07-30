// Memory board — age 5 only.
//
// Each word appears twice: once as a picture, once as written English. Pairing
// print with meaning under a light memory load is early reading practice that
// does not feel like reading practice. The word is spoken on every flip, so
// the child is always mapping sound → print → meaning together.
//
// Scored, but forgivingly: a word counts as known only if its pair is found
// without a failed attempt on it. Mismatches cost nothing but another look.

import { el, wait } from '../ui/dom.js';
import { pictureEl } from '../media/picture.js';
import { petReact, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith } from './base.js';

const FLIP_BACK_MS = 900;

export function run(ctx) {
  const words = (ctx.round.words || []).slice(0, 4);
  if (words.length < 2) return Promise.resolve();

  const deck = words
    .flatMap((word) => [{ word, face: 'pic' }, { word, face: 'text' }])
    .sort(() => Math.random() - 0.5);

  return new Promise((resolve) => {
    const misses = new Map(words.map((w) => [w.id, 0]));
    const startedAt = performance.now();
    let first = null;
    let busy = false;
    let matched = 0;

    const cards = deck.map((entry, index) => {
      const face = entry.face === 'pic'
        ? pictureEl(entry.word, { size: 'clamp(2.5rem, 10vw, 4rem)' })
        : el('span.memcard__word', { text: entry.word.en });

      const card = el('button.memcard', {
        type: 'button',
        'aria-label': entry.word.en,
        dataset: { index: String(index), id: entry.word.id },
        on: { click: () => onFlip(card, entry) },
      }, [
        el('span.memcard__back', { text: '❓' }),
        el('span.memcard__front', {}, [face]),
      ]);
      return card;
    });

    async function onFlip(card, entry) {
      if (busy || card.classList.contains('is-open') || card.classList.contains('is-done')) return;

      play('pop');
      card.classList.add('is-open');
      ctx.say(entry.word);

      if (!first) {
        first = { card, entry };
        return;
      }

      busy = true;
      const second = { card, entry };

      if (first.entry.word.id === second.entry.word.id) {
        play('correct');
        petReact.correct();
        [first.card, second.card].forEach((c) => c.classList.add('is-done'));
        matched += 1;
        first = null;
        busy = false;

        if (matched === words.length) {
          const ms = Math.round((performance.now() - startedAt) / words.length);
          for (const word of words) ctx.result(word.id, misses.get(word.id) === 0, ms);
          await wait(500);
          resolve();
        }
        return;
      }

      // No match: count it against both words, then turn them back over.
      play('wrong');
      petReact.wrong();
      misses.set(first.entry.word.id, misses.get(first.entry.word.id) + 1);
      misses.set(second.entry.word.id, misses.get(second.entry.word.id) + 1);

      await wait(FLIP_BACK_MS);
      first.card.classList.remove('is-open');
      second.card.classList.remove('is-open');
      first = null;
      busy = false;
    }

    setPetPlacement('corner');
    petReact.idle();
    stageWith(
      ctx,
      el('div.prompt', {}, [el('span.prompt__text', { text: t('act.memoryTitle') })]),
      el('div.memory', { dataset: { count: String(deck.length) } }, cards),
    );
  });
}
