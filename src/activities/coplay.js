// The co-play card, shown at the start of every toddler session.
//
// The evidence here is uncomfortable but clear: for children under about
// three, learning from a screen and carrying it into real life is much weaker
// than learning from a person. In one 2024 experiment three-year-olds picked
// up new verbs from live interaction and not from the app being tested.
//
// So rather than pretend otherwise, the app asks for an adult by name. It
// tells the grown-up exactly what to do — say the words out loud, react to
// what the child picks — because that is the part that actually teaches, and
// the screen is the prop.
//
// Dismissable in one tap. A nagging card that stands between a child and the
// activity would just train everyone to tap past it.

import { el } from '../ui/dom.js';
import { primaryButton, title } from '../ui/components.js';
import { petPreviewEl, showPet } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { stageWith } from './base.js';

export function run(ctx) {
  const { profile } = ctx;
  if (profile.settings.coPlay === false) return Promise.resolve();

  return new Promise((resolve) => {
    showPet(false);
    const done = () => { play('tap'); showPet(true); resolve(); };

    stageWith(
      ctx,
      el('div.coplay', {}, [
        petPreviewEl(profile.pet.id, {
          size: 'clamp(3.5rem, 15vw, 5.5rem)',
          accessories: profile.pet.accessories,
        }),
        title(t('coplay.title'), { emoji: '👨‍👧' }),
        el('p.coplay__lead', { text: t('coplay.lead', { name: profile.name }) }),
        el('ul.coplay__list', {}, [
          el('li', { text: t('coplay.tip1') }),
          el('li', { text: t('coplay.tip2') }),
          el('li', { text: t('coplay.tip3') }),
        ]),
        primaryButton(t('coplay.ready'), done, { emoji: '👍' }),
      ]),
    );
  });
}
