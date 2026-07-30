// The opening chant.
//
// Rhythmic repetition of words the child already knows. It does three things
// at once: it opens the session with guaranteed success, it primes the
// vocabulary that is about to be reviewed, and the steady beat plus the pet
// dancing is what makes a 2-year-old want to join in out loud.
//
// Unscored — nothing here is a question.

import { el, wait } from '../ui/dom.js';
import { pictureEl } from '../media/picture.js';
import { petReact, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith } from './base.js';

/** Times through the list of words. */
const ROUNDS = 2;

export async function run(ctx) {
  const words = ctx.round.words || [];
  if (!words.length) return;

  const cards = words.map((word) =>
    el('div.chantcard', { dataset: { id: word.id } }, [
      pictureEl(word, { size: 'clamp(3rem, 12vw, 5.5rem)' }),
      el('span.chantcard__word', { text: word.en }),
    ]));

  setPetPlacement('stage');
  petReact.dancing();

  stageWith(
    ctx,
    el('div.prompt', {}, [el('span.prompt__text', { text: t('act.chant') })]),
    el('div.chant', {}, cards),
    el('p.stage__hint', { text: t('act.chantHint') }),
  );

  for (let pass = 0; pass < ROUNDS; pass += 1) {
    for (const [i, word] of words.entries()) {
      cards[i].classList.add('is-active');
      play('beat');
      await ctx.say(word);
      await wait(pass === 0 ? 260 : 160);   // speed up slightly on the second pass
      cards[i].classList.remove('is-active');
    }
  }

  petReact.idle();
  await wait(300);
}
