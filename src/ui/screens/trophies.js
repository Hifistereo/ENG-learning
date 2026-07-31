// "Manas balvas" — the child's collection.
//
// Three things in one place: the pet and its level, the achievement cards
// (locked ones visible, with their goals), and the sticker book. This is the
// screen a child goes to when they are not in the mood to play but still want
// to see what they have.

import { el, mount } from '../dom.js';
import { title } from '../components.js';
import { achievementGrid, achievementProgress } from '../achievementCard.js';
import { collection } from '../../core/achievements.js';
import { getActiveProfile } from '../../state/profiles.js';
import { getProgress, knownCount } from '../../state/progress.js';
import { petPreviewEl, showPet } from '../../pet/pet.js';
import { petLevel, nextPetLevel } from '../../data/pets.js';
import { play } from '../../media/sfx.js';
import { t } from '../../i18n/lv.js';
import { navigate } from '../../router.js';

const STICKER_FACES = ['🌟', '🎈', '🍀', '🌈', '🦋', '🚀', '🐝', '🍄'];

export function render(root) {
  const profile = getActiveProfile();
  if (!profile) return navigate('/welcome', { replace: true });

  document.body.dataset.surface = 'kid';
  document.body.dataset.age = String(profile.ageBand);
  showPet(false);            // the panel below shows the pet instead

  const progress = getProgress(profile.id);
  const entries = collection(progress);
  const mastered = knownCount(profile.id, profile.ageBand);
  const level = petLevel(mastered);
  const next = nextPetLevel(mastered);

  const stickers = (progress.stickers || []).slice(-40).map((ts, i) =>
    el('div.sticker', { text: STICKER_FACES[(i + ts) % STICKER_FACES.length] }));

  mount(root, el('div.screen.screen--kid', {}, [
    el('div.topbar', {}, [
      el('button.iconbtn', {
        type: 'button',
        'aria-label': t('btn.back'),
        on: { click: () => { play('tap'); navigate('/'); } },
      }, '←'),
      el('span.spacer'),
    ]),
    el('div.stage.stage--scroll', {}, [
      title(t('tro.title'), { emoji: '🏆' }),

      el('div.petpanel', {}, [
        petPreviewEl(profile.pet.id, { size: '3.5rem', accessories: profile.pet.accessories }),
        el('div.petpanel__info', {}, [
          el('span.petpanel__name', { text: profile.pet.name }),
          el('span.petpanel__level', {
            text: t('tro.petLevel', { level: level.level, title: level.lv }),
          }),
          el('span.petpanel__level', {
            text: next
              ? t('tro.petNext', { n: next.minMastered - mastered })
              : t('tro.petMax'),
          }),
        ]),
      ]),

      achievementProgress(entries),
      achievementGrid(entries),

      stickers.length
        ? el('div.stack', { style: { width: '100%' } }, [
            el('h2.title', { style: { fontSize: 'var(--t-lg)' } }, t('tro.stickers')),
            el('div.stickers', {}, stickers),
          ])
        : null,
    ]),
  ]));
}
