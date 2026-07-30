// Optional "record yourself" support for the Say-It activity.
//
// Privacy rules this module enforces, not just documents:
//   - nothing is requested until the parent has switched the feature on AND
//     the child taps the record button
//   - the recording lives in memory as a Blob URL and is revoked when the
//     round ends or the screen unmounts
//   - it is never written to storage, never included in a backup export, and
//     never sent anywhere — the app makes no network requests at all
//
// Hearing your own voice next to the model is a strong pronunciation cue for
// a five-year-old, which is the only reason this exists.

let stream = null;
let recorder = null;
let chunks = [];
let lastUrl = null;

export function isSupported() {
  return !!(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.MediaRecorder);
}

/** Release the previous clip. Safe to call at any time. */
export function discard() {
  if (lastUrl) {
    URL.revokeObjectURL(lastUrl);
    lastUrl = null;
  }
}

/** Stop the mic entirely so the browser's recording indicator goes away. */
export function release() {
  try { recorder?.state === 'recording' && recorder.stop(); } catch { /* ignore */ }
  recorder = null;
  chunks = [];
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  discard();
}

/**
 * Begin recording.
 * @returns {Promise<{ok: boolean, error?: 'unsupported'|'denied'}>}
 */
export async function start() {
  if (!isSupported()) return { ok: false, error: 'unsupported' };
  discard();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    return { ok: false, error: 'denied' };
  }

  chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.addEventListener('dataavailable', (e) => {
    if (e.data.size) chunks.push(e.data);
  });
  recorder.start();
  return { ok: true };
}

/**
 * Stop recording and hand back a playable URL.
 * @returns {Promise<string|null>} object URL, owned by this module
 */
export function stop() {
  return new Promise((resolve) => {
    if (!recorder || recorder.state !== 'recording') {
      release();
      return resolve(null);
    }
    recorder.addEventListener('stop', () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      chunks = [];
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      recorder = null;
      lastUrl = blob.size ? URL.createObjectURL(blob) : null;
      resolve(lastUrl);
    }, { once: true });
    try { recorder.stop(); } catch { resolve(null); }
  });
}

/** Play back the clip from stop(). Resolves when it finishes. */
export function playback(url) {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const audio = new Audio(url);
    audio.addEventListener('ended', resolve, { once: true });
    audio.addEventListener('error', resolve, { once: true });
    audio.play().catch(resolve);
    setTimeout(resolve, 10000);
  });
}
