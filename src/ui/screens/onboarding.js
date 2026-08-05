// First run: create a child profile and choose a pet.
//
// Three short steps rather than one long form. The pet choice is last and gets
// its own screen because it is the part the child should be involved in —
// naming the companion is what makes them care about it later.

import { hubChild, hubAgeBand } from '../../state/kmp.js';
import { el, mount } from '../dom.js';
import { title, primaryButton } from '../components.js';
import { petPreviewEl, setProfile as setPetProfile, showPet } from '../../pet/pet.js';
import { PETS, getPet } from '../../data/pets.js';
import { createProfile } from '../../state/profiles.js';
import { play } from '../../media/sfx.js';
import { unlockAudio } from '../../media/speech.js';
import { t } from '../../i18n/lv.js';
import { navigate } from '../../router.js';

export function render(root) {
  document.body.dataset.surface = 'kid';
  document.body.dataset.age = '5';
  showPet(false);

  // Anything the hub already asked, we do not ask again. A child named on
  // kidmindpath.com lands straight on the pet chooser — which is the one
  // question the hub deliberately does not ask, because picking a companion is
  // part of the game rather than a form field.
  const fromHub = hubChild();
  const hubBand = hubAgeBand();
  const draft = {
    name: fromHub?.name || '',
    ageBand: hubBand,
    petId: PETS[0].id,
    petName: '',
  };
  let step = draft.name ? (draft.ageBand ? 2 : 1) : 0;

  const stage = el('div.stage');
  const screen = el('div.screen.screen--kid', {}, [stage]);
  mount(root, screen);

  const go = (next) => { step = next; draw(); };

  function draw() {
    if (step === 0) return drawName();
    if (step === 1) return drawAge();
    return drawPet();
  }

  // --- Step 1: name ---
  function drawName() {
    const input = el('input', {
      type: 'text',
      value: draft.name,
      placeholder: t('onb.namePlaceholder'),
      maxLength: 16,
      autocomplete: 'off',
      on: { input: (e) => { draft.name = e.target.value; next.disabled = !draft.name.trim(); } },
    });

    const next = primaryButton(t('btn.next'), () => {
      draft.name = draft.name.trim();
      if (draft.name) go(1);
    });
    next.disabled = !draft.name.trim();

    mount(stage,
      title(t('onb.welcome'), { emoji: '👋' }),
      el('p.stage__hint', { text: t('onb.intro') }),
      el('label.field', {}, [
        el('span.field__label', { text: t('onb.nameQ') }),
        input,
      ]),
      next);
    setTimeout(() => input.focus(), 50);
  }

  // --- Step 2: age band ---
  function drawAge() {
    const choose = (band) => {
      draft.ageBand = band;
      play('tap');
      go(2);
    };

    mount(stage,
      title(t('onb.ageQ'), { emoji: '🎂' }),
      el('div.stack', { style: { width: 'min(24rem, 100%)' } }, [
        el('button.agecard', { type: 'button', on: { click: () => choose(2) } }, [
          el('span.agecard__title', { text: `🧸 ${t('onb.age2')}` }),
          el('span.agecard__hint', { text: t('onb.age2hint') }),
        ]),
        el('button.agecard', { type: 'button', on: { click: () => choose(5) } }, [
          el('span.agecard__title', { text: `🎒 ${t('onb.age5')}` }),
          el('span.agecard__hint', { text: t('onb.age5hint') }),
        ]),
      ]),
      el('button.btn.btn--ghost', { type: 'button', on: { click: () => go(0) } }, t('btn.back')));
  }

  // --- Step 3: pet + its name ---
  function drawPet() {
    const nameInput = el('input', {
      type: 'text',
      value: draft.petName,
      maxLength: 16,
      autocomplete: 'off',
      on: { input: (e) => { draft.petName = e.target.value; } },
    });

    const nameLabel = el('span.field__label', { text: '' });
    const grid = el('div.picker');

    const select = (petId) => {
      draft.petId = petId;
      const def = getPet(petId);
      // Only overwrite the name while the parent has not typed their own.
      if (!nameInput.dataset.touched) {
        draft.petName = def.defaultName;
        nameInput.value = def.defaultName;
      }
      nameLabel.textContent = t('onb.petNameQ', { pet: def.lv.toLowerCase() });
      grid.querySelectorAll('.picker__item').forEach((item) => {
        item.classList.toggle('is-selected', item.dataset.id === petId);
      });
      play('pop');
    };

    nameInput.addEventListener('input', () => { nameInput.dataset.touched = '1'; });

    for (const pet of PETS) {
      grid.append(el('button.picker__item', {
        type: 'button',
        dataset: { id: pet.id },
        on: { click: () => select(pet.id) },
      }, [
        petPreviewEl(pet.id, { size: '2.75rem' }),
        el('span', { text: pet.lv }),
      ]));
    }

    mount(stage,
      title(t('onb.petQ'), { emoji: '🐾' }),
      grid,
      el('label.field', {}, [nameLabel, nameInput]),
      primaryButton(t('btn.start'), finish, { emoji: '🚀' }),
      el('button.btn.btn--ghost', { type: 'button', on: { click: () => go(1) } }, t('btn.back')));

    select(draft.petId);
  }

  function finish() {
    // The button tap is our one guaranteed user gesture — unlock audio here or
    // iOS stays silent for the whole first session.
    unlockAudio();
    const profile = createProfile({
      // Take the hub's child id when there is one, so this profile and the
      // shared one are the same child. Without it the collection page on
      // kidmindpath.com would look for progress under an id this app never
      // used, and show an empty album for a child who has been playing.
      id: fromHub?.id,
      name: draft.name || '?',
      ageBand: draft.ageBand || 5,
      petId: draft.petId,
      petName: (draft.petName || '').trim() || getPet(draft.petId).defaultName,
    });
    setPetProfile(profile);
    play('celebrate');
    navigate('/', { replace: true });
  }

  draw();
}
