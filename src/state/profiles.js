// Child profiles and their settings.
//
// A profile is per-child rather than per-device because the two children share
// one tablet and their progress, pace, and pet must not mix.

import { read, write } from './storage.js';
import { PETS, getPet } from '../data/pets.js';

const KEY_PROFILES = 'profiles';
const KEY_APP = 'app';

/** Items per session, by the parent-chosen length. */
export const SESSION_LENGTHS = {
  short:  { 2: 8,  5: 12 },
  normal: { 2: 12, 5: 18 },
  long:   { 2: 16, 5: 26 },
};

export function defaultSettings(ageBand) {
  return {
    sessionLength: ageBand === 2 ? 'short' : 'normal',
    lvHints: true,        // helpful at the start, worth switching off later
    mic: false,           // opt-in only — see the plan's privacy note
    petHints: true,
    sound: true,
    voiceURI: null,       // null = pick the best en-US voice automatically
    rate: ageBand === 2 ? 0.75 : 0.85,
    unlockedUnits: [],    // parent overrides on top of earned unlocks
  };
}

function normalize(profile) {
  const ageBand = profile.ageBand === 2 ? 2 : 5;
  const pet = profile.pet || {};
  const petDef = getPet(pet.id);
  return {
    id: profile.id,
    name: profile.name || '?',
    ageBand,
    createdAt: profile.createdAt || Date.now(),
    pet: {
      id: petDef.id,
      name: pet.name || petDef.defaultName,
      accessories: Array.isArray(pet.accessories) ? pet.accessories : [],
    },
    settings: { ...defaultSettings(ageBand), ...(profile.settings || {}) },
  };
}

export function listProfiles() {
  const raw = read(KEY_PROFILES, []);
  return Array.isArray(raw) ? raw.map(normalize) : [];
}

export function getProfile(id) {
  return listProfiles().find((p) => p.id === id) || null;
}

function saveProfiles(profiles) {
  write(KEY_PROFILES, profiles);
  return profiles;
}

function makeId(name) {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'kid';
  return `${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createProfile({ name, ageBand, petId, petName }) {
  const profiles = listProfiles();
  const petDef = getPet(petId || PETS[0].id);
  const profile = normalize({
    id: makeId(name),
    name,
    ageBand,
    createdAt: Date.now(),
    pet: { id: petDef.id, name: petName || petDef.defaultName, accessories: [] },
  });
  saveProfiles([...profiles, profile]);
  setActiveProfileId(profile.id);
  return profile;
}

export function updateProfile(id, patch) {
  const profiles = listProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const merged = normalize({
    ...profiles[idx],
    ...patch,
    pet: { ...profiles[idx].pet, ...(patch.pet || {}) },
    settings: { ...profiles[idx].settings, ...(patch.settings || {}) },
  });
  profiles[idx] = merged;
  saveProfiles(profiles);
  return merged;
}

export function updateSettings(id, patch) {
  return updateProfile(id, { settings: patch });
}

export function deleteProfile(id) {
  saveProfiles(listProfiles().filter((p) => p.id !== id));
  if (getActiveProfileId() === id) {
    const remaining = listProfiles();
    setActiveProfileId(remaining[0]?.id || null);
  }
}

/** Give the pet a new accessory. Idempotent — achievements may re-award. */
export function grantAccessory(id, accessoryId) {
  const profile = getProfile(id);
  if (!profile || profile.pet.accessories.includes(accessoryId)) return profile;
  return updateProfile(id, {
    pet: { accessories: [...profile.pet.accessories, accessoryId] },
  });
}

// --- Active profile ------------------------------------------------------

export function getActiveProfileId() {
  return read(KEY_APP, {})?.activeProfileId || null;
}

export function setActiveProfileId(id) {
  write(KEY_APP, { ...read(KEY_APP, {}), activeProfileId: id });
}

/** The profile currently playing, falling back to the only/first one. */
export function getActiveProfile() {
  const profiles = listProfiles();
  if (!profiles.length) return null;
  const id = getActiveProfileId();
  return profiles.find((p) => p.id === id) || profiles[0];
}

/** How many items a session should contain for this profile. */
export function sessionSize(profile) {
  const table = SESSION_LENGTHS[profile.settings.sessionLength] || SESSION_LENGTHS.normal;
  return table[profile.ageBand] || table[5];
}
