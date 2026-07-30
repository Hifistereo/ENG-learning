// Sound effects, synthesised with WebAudio so there are no files to load and
// nothing to go wrong offline.
//
// Deliberate choice: there is no buzzer. A wrong tap plays a soft, neutral
// two-note phrase that reads as "hmm, look again" rather than "WRONG". Harsh
// failure sounds make small children stop tapping altogether, which costs far
// more than the feedback is worth.

let ctx = null;
let enabled = true;

function context() {
  if (ctx) return ctx;
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Call from the first user gesture, alongside speech.unlockAudio(). */
export function unlockSfx() {
  const c = context();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setSfxEnabled(on) {
  enabled = !!on;
}

/**
 * One note.
 * @param {number} freq
 * @param {number} start - seconds from now
 * @param {number} dur
 * @param {number} gain - peak volume 0..1
 * @param {OscillatorType} type
 */
function note(freq, start, dur, gain = 0.14, type = 'sine') {
  const c = context();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  const t = c.currentTime + start;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);

  // Short attack, exponential release — a plain on/off gate clicks audibly.
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(amp).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  tap:   () => note(660, 0, 0.07, 0.08),
  // Rising major triad: unmistakably "yes" without being shrill.
  correct: () => { note(523, 0, 0.12); note(659, 0.09, 0.12); note(784, 0.18, 0.22); },
  // Gentle downward step, quiet, warm triangle wave.
  wrong: () => { note(392, 0, 0.13, 0.09, 'triangle'); note(330, 0.11, 0.2, 0.08, 'triangle'); },
  // Longer fanfare for the end of a session.
  celebrate: () => {
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.1, 0.3, 0.13));
    note(1319, 0.42, 0.5, 0.11);
  },
  // Sparkle for an achievement card flipping in.
  unlock: () => {
    [880, 1109, 1319, 1760].forEach((f, i) => note(f, i * 0.07, 0.22, 0.1, 'triangle'));
  },
  pop:  () => note(880, 0, 0.06, 0.09, 'triangle'),
  // Steady pulse the chant activity claps along to.
  beat: () => note(440, 0, 0.09, 0.07, 'square'),
};

export function play(name) {
  if (!enabled) return;
  const sound = SOUNDS[name];
  if (!sound) return;
  try { sound(); } catch { /* audio is never worth breaking an activity for */ }
}
