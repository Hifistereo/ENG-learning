// The session player.
//
// Owns the loop: take the current round, hand it to the matching activity,
// wait for it to resolve, advance. Activities never touch the session or the
// router — they render, they resolve, that is all.

import { el, mount, wait } from '../dom.js';
import { kidScreen, primaryButton, confetti, title } from '../components.js';
import { revealCard } from '../achievementCard.js';
import { activityFor } from '../../activities/index.js';
import { createSession } from '../../core/session.js';
import { availableWords } from '../../core/selector.js';
import { newlyEarned, rewardsFor } from '../../core/achievements.js';
import { getActiveProfile, grantAccessory, getProfile } from '../../state/profiles.js';
import {
  getProgress, recordAnswer, commitSession, unlockAchievements,
  unlockUnit, knownCount,
} from '../../state/progress.js';
import { unlockedUnits } from '../../core/selector.js';
import { sessionSize } from '../../state/profiles.js';
import { say, sayWord, stopSpeaking, unlockAudio } from '../../media/speech.js';
import { play, unlockSfx, setSfxEnabled } from '../../media/sfx.js';
import * as mic from '../../media/mic.js';
import {
  showPet, petReact, setProfile as setPetProfile, currentPetLevel,
  clearBubble, petPreviewEl,
} from '../../pet/pet.js';
import { t } from '../../i18n/lv.js';
import { navigate } from '../../router.js';

/** Rounds where the pet leads from the middle of the screen. */
const PET_ON_STAGE = new Set(['chant', 'tpr']);

export function render(root) {
  const profile = getActiveProfile();
  if (!profile) return navigate('/welcome', { replace: true });

  document.body.dataset.surface = 'kid';
  document.body.dataset.age = String(profile.ageBand);
  setSfxEnabled(profile.settings.sound);
  unlockAudio();
  unlockSfx();

  const progress = getProgress(profile.id);
  const pool = availableWords(profile, progress);
  const session = createSession(profile, progress, { size: sessionSize(profile) });

  const screen = kidScreen({ onQuit: quit, fraction: 0 });
  mount(root, screen.root);

  setPetProfile(profile);
  showPet(true);
  petReact.idle();

  let abandoned = false;

  // Voice settings are per-child, so wrap them once here rather than
  // threading settings through every activity.
  const voiceOpts = { rate: profile.settings.rate, voiceURI: profile.settings.voiceURI };

  const ctx = {
    stage: screen.stage,
    profile,
    progress,
    pool,
    round: null,
    say: (word) => sayWord(word, voiceOpts),
    sayText: (text) => say(text, voiceOpts),
    /**
     * Log an answer.
     *
     * `activity` and `aided` are what stop mastery inflating: the evidence
     * model uses them to decide what this answer actually demonstrates, so a
     * word found only after the pet pointed at it earns nothing, and no
     * amount of same-picture tapping ever counts as transfer or production.
     */
    result: (wordId, ok, ms, meta = {}) => {
      session.record(wordId, ok, ms);
      recordAnswer(profile.id, wordId, ok, {
        ageBand: profile.ageBand,
        activity: meta.activity || ctx.round?.type || 'listenTap',
        aided: !!meta.aided,
      });
    },
    quit,
  };

  function quit() {
    if (abandoned) return;
    // A half-finished session is still practice: everything answered so far is
    // already saved by ctx.result, so leaving costs the child nothing.
    abandoned = true;
    stopSpeaking();
    mic.release();
    navigate('/');
  }

  async function loop() {
    while (!abandoned && !session.isFinished()) {
      const round = session.current();
      if (!round) break;

      screen.setProgress(session.fraction);

      if (round.type === 'celebrate') {
        await finish();
        return;
      }

      const run = activityFor(round.type);
      if (!run) {                       // unknown round type: skip rather than stall
        session.advance();
        continue;
      }

      ctx.round = round;
      clearBubble();          // never carry a word's bubble into the next round
      // Chant and TPR put the pet on the stage; everything else keeps it in a
      // corner. Reserving the space here rather than inside each activity
      // keeps the two in step.
      screen.stage.classList.toggle('stage--petabove', PET_ON_STAGE.has(round.type));
      try {
        await run(ctx);
      } catch (err) {
        console.error(`activity "${round.type}" failed`, err);
      }
      if (abandoned) return;
      session.advance();
      await wait(250);
    }
    if (!abandoned) await finish();
  }

  /** End of session: save, award, celebrate. */
  async function finish() {
    stopSpeaking();
    mic.release();
    screen.setProgress(1);

    const summary = session.summary();
    commitSession(profile.id, summary);

    // Open the next unit if this session finished the current one.
    const fresh = getProgress(profile.id);
    for (const unitId of unlockedUnits(profile, fresh)) unlockUnit(profile.id, unitId);

    // Re-evaluate the whole catalogue: cards added in a later version unlock
    // here from old history, with no migration.
    const earned = newlyEarned(fresh, profile);
    const unlocked = unlockAchievements(profile.id, earned);
    let updated = profile;
    for (const accessory of rewardsFor(unlocked).accessories) {
      updated = grantAccessory(profile.id, accessory) || updated;
    }
    setPetProfile(getProfile(profile.id) || updated);

    await showCelebration(summary, unlocked);
  }

  async function showCelebration(summary, unlockedIds) {
    play('celebrate');
    confetti();

    const learned = new Set(summary.items.map((i) => i.id)).size;
    const sticker = ['🌟', '🎈', '🍀', '🌈', '🦋', '🚀', '🐝', '🍄'][
      Math.floor(Math.random() * 8)
    ];

    const cardSlot = el('div.stack.celebrate__cards');

    // The pet joins the celebration inline rather than from the floating
    // layer: the reveal can grow to several cards tall, and a fixed-position
    // pet would end up sitting on top of the buttons.
    showPet(false);
    const current = getProfile(profile.id) || profile;
    const petNode = petPreviewEl(current.pet.id, {
      size: 'clamp(3.5rem, 14vw, 5.5rem)',
      accessories: current.pet.accessories,
    });
    petNode.classList.add('pet-preview--partying');

    mount(screen.stage, el('div.celebrate', {}, [
      title(t('end.title'), { emoji: '🎉' }),
      petNode,
      el('div.celebrate__sticker', { text: sticker }),
      el('p.stage__hint', { text: t('end.words', { n: learned }) }),
      cardSlot,
      el('div.home__actions', {}, [
        primaryButton(t('end.again'), () => render(root), { emoji: '🔁' }),
        el('button.btn', { type: 'button', on: { click: () => navigate('/') } }, `🏠 ${t('end.home')}`),
      ]),
    ]));

    // Reveal any new cards one at a time so each gets its own moment.
    if (unlockedIds.length) {
      cardSlot.append(el('p.stage__hint', { text: t('end.newCards') }));
      const { collection } = await import('../../core/achievements.js');
      const entries = collection(getProgress(profile.id))
        .filter((entry) => unlockedIds.includes(entry.card.id));
      for (const entry of entries) {
        if (abandoned) return;
        play('unlock');
        await revealCard(entry, cardSlot);
        await wait(400);
      }
    }

    // A pet level-up is worth its own line — it is the long-term thread that
    // ties months of short sessions together.
    const level = currentPetLevel(knownCount(profile.id, profile.ageBand));
    if (level.level > 1) {
      cardSlot.append(el('p.stage__hint', {
        text: t('end.petLevel', { pet: profile.pet.name, level: level.level }),
      }));
    }
  }

  loop();

  return () => {
    abandoned = true;
    stopSpeaking();
    mic.release();
    showPet(false);
  };
}
