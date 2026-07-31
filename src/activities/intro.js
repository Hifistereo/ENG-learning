// Meeting a new word.
//
// Unscored on purpose. The child meets the word three times here (see it, hear
// it, watch what it means) with nothing to get wrong, then meets it again as a
// real question later in the session. Testing a label the child has never heard
// is the fastest way to teach them that the app is something to avoid.
//
// The word arrives IN the scene rather than on a white card in the middle of an
// empty screen: the pet notices something, names it, and the thing acts out its
// own meaning where it stands. Same three repetitions, but the child is being
// shown something rather than presented with a flashcard.

import { el, wait } from '../ui/dom.js';
import { lvHintButton } from '../ui/components.js';
import { pictureEl } from '../media/picture.js';
import { petReact, petSay } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { enact, canEnact } from '../media/enact.js';
import { withArticle } from '../data/words.js';
import { t } from '../i18n/lv.js';

const REPEATS = 3;

export async function run(ctx) {
  const { round, profile, scene } = ctx;
  const word = round.word;

  // "Look! A cat." — the pet's own reaction to spotting it, which is how a
  // parent would introduce it in a picture book.
  const sentence = `Look! ${capitalise(withArticle(word))}.`;

  const picture = pictureEl(word, {
    size: 'clamp(5rem, 22vw, 8.5rem)',
    className: 'cast cast--newword',
  });

  scene.clearProps();
  scene.setCast(picture);
  scene.say(sentence, t('say.thisIs', { word: word.lv }));
  scene.setExtra(profile.settings.lvHints ? lvHintButton(word) : null);

  petReact.asking();
  petSay(word.en, 2600);
  play('pop');

  await ctx.sayText(sentence);

  for (let i = 0; i < REPEATS; i += 1) {
    picture.classList.add('is-pulsing');
    await ctx.say(word);
    picture.classList.remove('is-pulsing');
    // Show what the word means, not just that something happened: "jump" hops,
    // "eat" vanishes into a mouth. Words with no honest enactment stay still
    // rather than getting decorative motion that competes for attention.
    if (canEnact(word.id)) await enact(picture, word);
    await wait(450);
  }

  // Co-play: for toddlers the adult saying the word matters more than anything
  // on the screen, so we ask for it directly at the moment it counts.
  if (profile.ageBand === 2 && profile.settings.coPlay !== false) {
    scene.setExtra(el('p.coplay-nudge', { text: t('act.grownupSay', { word: word.en }) }));
  }

  petReact.idle();
  await wait(300);
  scene.clearCast();
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
