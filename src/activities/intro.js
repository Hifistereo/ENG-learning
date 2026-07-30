// Introducing a new word.
//
// Unscored on purpose. The child meets the word three times in a row here
// (see it, hear it, tap it) with nothing to get wrong, then meets it again as
// a real question later in the session. Testing a label the child has never
// heard is the fastest way to teach them that the app is something to avoid.

import { el, wait } from '../ui/dom.js';
import { bigCard, lvHintButton } from '../ui/components.js';
import { petReact, petSay, setPetPlacement } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith } from './base.js';

const REPEATS = 3;

export async function run(ctx) {
  const { round, profile } = ctx;
  const word = round.word;

  setPetPlacement('corner');

  const card = bigCard(word, {
    showText: profile.ageBand === 5,
    onTap: () => { play('tap'); ctx.say(word); },
  });
  card.classList.add('bigcard--intro');

  stageWith(
    ctx,
    el('div.prompt', {}, [el('span.prompt__text.prompt__text--new', { text: t('act.newWord') })]),
    card,
    profile.settings.lvHints ? el('div.stage__footer', {}, [lvHintButton(word)]) : null,
  );

  petReact.asking();
  petSay(word.en, 2600);
  play('pop');

  for (let i = 0; i < REPEATS; i += 1) {
    card.classList.add('is-pulsing');
    await ctx.say(word);
    card.classList.remove('is-pulsing');
    await wait(500);
  }

  petReact.idle();
}
