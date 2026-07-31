// English audio.
//
// Resolution order for every spoken word:
//   1. assets/audio/en/<id>.mp3 — a real recording, if one has been added
//   2. SpeechSynthesis with an en-US voice at a slowed, kid-friendly rate
//
// The app ships with (2) so it works out of the box on any device. Recording
// native audio later is a pure content task: drop MP3s in the folder, list
// them in manifest.json, done.

import { loadManifest } from './manifest.js';

const AUDIO_DIR = './assets/audio/en/';
const AUDIO_MANIFEST = `${AUDIO_DIR}manifest.json`;

/** Voices we prefer when several en-US options exist, best first. */
const PREFERRED = [
  'Samantha', 'Ava', 'Allison', 'Susan', 'Google US English',
  'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Karen', 'Moira',
];

let voicesReady = null;
let unlocked = false;
let currentAudio = null;

// --- Voices ---------------------------------------------------------------

/** Resolves once the browser has published its voice list. */
export function getVoices() {
  if (voicesReady) return voicesReady;
  const synth = globalThis.speechSynthesis;
  if (!synth) return Promise.resolve([]);

  voicesReady = new Promise((resolve) => {
    const immediate = synth.getVoices();
    if (immediate.length) return resolve(immediate);

    // Safari and Chrome publish voices asynchronously on first load.
    const onChange = () => {
      synth.removeEventListener('voiceschanged', onChange);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onChange);
    setTimeout(() => resolve(synth.getVoices()), 2000); // never hang a session
  });
  return voicesReady;
}

/** English voices only, en-US first — that is the accent we teach. */
export async function englishVoices() {
  const all = await getVoices();
  return all
    .filter((v) => /^en/i.test(v.lang))
    .sort((a, b) => {
      const us = (v) => (/en[-_]US/i.test(v.lang) ? 0 : 1);
      if (us(a) !== us(b)) return us(a) - us(b);
      const rank = (v) => {
        const i = PREFERRED.findIndex((n) => v.name.includes(n));
        return i === -1 ? PREFERRED.length : i;
      };
      return rank(a) - rank(b);
    });
}

async function pickVoice(voiceURI) {
  const voices = await englishVoices();
  if (!voices.length) return null;
  if (voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen) return chosen;
  }
  return voices[0];
}

// --- Audio unlock ---------------------------------------------------------

/**
 * iOS and some Android browsers refuse to produce sound until audio has been
 * started inside a real user gesture. Call this from the first tap; it is
 * cheap and idempotent.
 */
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  try {
    const synth = globalThis.speechSynthesis;
    if (synth) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    }
  } catch { /* not fatal — worst case the first word is silent */ }
}

export const isUnlocked = () => unlocked;

// --- Speaking -------------------------------------------------------------

export function stopSpeaking() {
  try { globalThis.speechSynthesis?.cancel(); } catch { /* ignore */ }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function playRecording(id) {
  return new Promise((resolve) => {
    const audio = new Audio(`${AUDIO_DIR}${encodeURIComponent(id)}.mp3`);
    currentAudio = audio;
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      resolve(ok);
    };
    audio.addEventListener('ended', () => done(true));
    audio.addEventListener('error', () => done(false));
    audio.play().catch(() => done(false));
    setTimeout(() => done(true), 8000);
  });
}

function speakWithSynth(text, { rate, pitch, voice }) {
  const synth = globalThis.speechSynthesis;
  if (!synth) return new Promise((resolve) => setTimeout(resolve, 600));

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang || 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (voice) utterance.voice = voice;
    utterance.addEventListener('end', done);
    utterance.addEventListener('error', done);

    synth.cancel();
    synth.speak(utterance);

    // Guard: some browsers silently drop an utterance and never fire `end`.
    //
    // Scaled by rate. It used to assume a fixed reading speed, so at the slower
    // rates this version ships with, a long story line could still be speaking
    // when the guard gave up and let the next thing start. The constants keep
    // roughly a 2x margin over how long the line actually takes — comfortably
    // clear of real speech, without leaving a child staring at silence for
    // half a minute on the rare browser where synthesis is simply broken.
    setTimeout(done, (1200 + text.length * 110) / Math.max(0.3, rate));
  });
}

/**
 * Silence held after every line, before the caller is allowed to continue.
 *
 * Small children need noticeably longer than adults to process what they just
 * heard, and back-to-back speech is a large part of what made this app feel
 * hurried: an answer was still being said when the next question cancelled it,
 * and the word that got chopped was usually the one that mattered. A beat of
 * quiet after each line is the cheapest fix for that and the closest the app
 * gets to how an adult actually talks to a two-year-old.
 */
export const SETTLE_MS = 420;

/**
 * Speak English. Resolves once the audio has finished AND a short silence has
 * passed, so activities can sequence prompts without guessing at durations and
 * without ever landing on the heel of the previous word.
 *
 * @param {string} text - what to say
 * @param {object} [opts]
 * @param {string} [opts.id] - word id; enables the recorded-audio path
 * @param {number} [opts.rate=0.7] - see RECOMMENDED_RATE in state/profiles.js
 * @param {number} [opts.pitch=1.05] - slightly up reads as friendlier
 * @param {string} [opts.voiceURI]
 * @param {number} [opts.settle] - override the trailing silence
 */
export async function say(text, opts = {}) {
  const {
    id = null, rate = 0.7, pitch = 1.05, voiceURI = null, settle = SETTLE_MS,
  } = opts;
  if (!text) return;
  unlockAudio();
  stopSpeaking();

  if (id) {
    const available = await loadManifest(AUDIO_MANIFEST);
    if (available.has(id)) {
      const ok = await playRecording(id);
      if (ok) return pause(settle);      // fall through to synthesis on failure
    }
  }

  const voice = await pickVoice(voiceURI);
  await speakWithSynth(text, { rate, pitch, voice });
  await pause(settle);
}

const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

/** Speak a list in order, with a gap between items. Used by the chant. */
export async function sayAll(items, opts = {}, gapMs = 350) {
  for (const item of items) {
    const { text, id } = typeof item === 'string' ? { text: item, id: null } : item;
    await say(text, { ...opts, id });
    await new Promise((r) => setTimeout(r, gapMs));
  }
}

/** Convenience for a word object from data/words.js. */
export const sayWord = (word, opts = {}) => say(word.en, { ...opts, id: word.id });
