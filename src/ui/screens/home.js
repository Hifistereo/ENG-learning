// Home screen: the pet, one big Play button, and a quiet way through to the
// parent area.
//
// Almost nothing else on purpose. A home screen full of options is a home
// screen a 2-year-old gets lost on, and every extra button is one more thing
// between them and the activity.

import { el, mount } from '../dom.js';
import { title, primaryButton } from '../components.js';
import { showPet, petPreviewEl, setProfile as setPetProfile } from '../../pet/pet.js';
import { getActiveProfile, listProfiles, setActiveProfileId } from '../../state/profiles.js';
import { getProgress, knownCount } from '../../state/progress.js';
import { dayKey } from '../../core/stats.js';
import { unlockAudio } from '../../media/speech.js';
import { unlockSfx, play, setSfxEnabled } from '../../media/sfx.js';
import { APP_VERSION } from '../../version.js';
import { t } from '../../i18n/lv.js';
import { navigate } from '../../router.js';

export function render(root) {
  const profile = getActiveProfile();
  if (!profile) return navigate('/welcome', { replace: true });

  document.body.dataset.surface = 'kid';
  document.body.dataset.age = String(profile.ageBand);
  setSfxEnabled(profile.settings.sound);

  const progress = getProgress(profile.id);
  const known = knownCount(profile.id, profile.ageBand);
  const playedToday = (progress.sessions || []).some((s) => dayKey(s.ts) === dayKey(Date.now()));

  setPetProfile(profile);
  // Home renders the pet inline inside its own disc rather than through the
  // floating layer, so it always sits exactly where the layout expects. The
  // floating pet is for activity screens, where it has to survive DOM swaps.
  showPet(false);

  // A sleeping pet is an invitation to come back, not a reproach for being
  // away — it wakes the moment the child taps Play.
  const petNode = petPreviewEl(profile.pet.id, {
    size: 'clamp(4.5rem, 20vw, 7rem)',
    accessories: profile.pet.accessories,
  });
  petNode.classList.add(playedToday ? 'pet-preview--idle' : 'pet-preview--sleeping');

  const startPlaying = () => {
    unlockAudio();
    unlockSfx();
    play('tap');
    navigate('/play');
  };

  const others = listProfiles().filter((p) => p.id !== profile.id);

  mount(root, el('div.screen.screen--kid', {}, [
    el('div.home', {}, [
      title(t('home.hi', { name: profile.name }), { emoji: '👋' }),
      el('div.home__pet', {}, [
        petNode,
        !playedToday ? el('span.home__zzz', { text: '💤' }) : null,
      ]),
      el('p.stage__hint', {
        text: playedToday
          ? t('home.todayDone')
          : t('home.petAsleep', { pet: profile.pet.name }),
      }),
      known > 0 ? el('div.home__stat', { text: `⭐ ${t('home.wordsKnown', { n: known })}` }) : null,
      el('div.home__actions', {}, [
        primaryButton(t('home.play'), startPlaying, { emoji: '▶️' }),
        el('button.btn', {
          type: 'button',
          on: { click: () => { play('tap'); navigate('/trophies'); } },
        }, `🏆 ${t('home.trophies')}`),
        others.length
          ? el('button.btn', {
              type: 'button',
              on: {
                click: () => {
                  // Round-robin through the children — simpler for a parent
                  // handing the tablet over than a picker screen.
                  const next = others[0];
                  setActiveProfileId(next.id);
                  play('pop');
                  render(root);
                },
              },
            }, `🔄 ${t('home.switch')}`)
          : null,
        el('button.btn.btn--ghost', {
          type: 'button',
          on: { click: () => navigate('/parent') },
        }, `⚙️ ${t('home.parents')}`),
      ]),
    ]),
    el('div.footer-version', { text: t('app.version', { v: APP_VERSION }) }),
  ]));

  return () => showPet(false);
}
