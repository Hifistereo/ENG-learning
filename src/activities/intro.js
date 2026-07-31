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
import { enact, canEnact } from '../media/enact.js';
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

  const picture = card.querySelector('.picture');

  for (let i = 0; i < REPEATS; i += 1) {
    card.classList.add('is-pulsing');
    await ctx.say(word);
    card.classList.remove('is-pulsing');
    // Show what the word means, not just that something happened: "jump" hops,
    // "eat" vanishes into a mouth. Words with no honest enactment stay still
    // rather than getting decorative motion that competes for attention.
    if (canEnact(word.id)) await enact(picture, word);
    await wait(450);
  }

  // Co-play: for toddlers the adult saying the word matters more than anything
  // on the screen, so we ask for it directly at the moment it counts.
  if (profile.ageBand === 2 && profile.settings.coPlay !== false) {
    ctx.stage.append(el('p.coplay-nudge', { text: t('act.grownupSay', { word: word.en }) }));
  }

  petReact.idle();
}
