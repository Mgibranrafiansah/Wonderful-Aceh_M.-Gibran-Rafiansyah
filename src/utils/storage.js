import {
  SEED_DESTINATIONS,
  SEED_FOODS,
  SEED_PACKAGES,
  SEED_STAYS,
} from '../data/seed.js';

const KEYS = {
  destinations: 'he_destinations_v2',
  foods: 'he_foods_v2',
  stays: 'he_stays_v2',
  packages: 'he_packages_v2',
  favorites: 'he_favorites_v2',
  itineraries: 'he_itineraries_v2',
  language: 'he_language_v2',
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return clone(fallback);
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? clone(fallback) : parsed;
  } catch {
    return clone(fallback);
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadAppState() {
  const savedLang = window.localStorage.getItem(KEYS.language);
  return {
    language: savedLang === 'en' ? 'en' : 'id',
    destinations: readJson(KEYS.destinations, SEED_DESTINATIONS),
    foods: readJson(KEYS.foods, SEED_FOODS),
    stays: readJson(KEYS.stays, SEED_STAYS),
    packages: readJson(KEYS.packages, SEED_PACKAGES),
    favorites: readJson(KEYS.favorites, []),
    savedItineraries: readJson(KEYS.itineraries, []),
  };
}

export function persistAppState(state) {
  writeJson(KEYS.destinations, state.destinations);
  writeJson(KEYS.foods, state.foods);
  writeJson(KEYS.stays, state.stays);
  writeJson(KEYS.packages, state.packages);
  writeJson(KEYS.favorites, state.favorites);
  writeJson(KEYS.itineraries, state.savedItineraries);
  try {
    window.localStorage.setItem(KEYS.language, state.language);
  } catch {
    // Ignore
  }
}

export function resetToSeedState(currentLang = 'id') {
  const fresh = {
    language: currentLang,
    destinations: clone(SEED_DESTINATIONS),
    foods: clone(SEED_FOODS),
    stays: clone(SEED_STAYS),
    packages: clone(SEED_PACKAGES),
    favorites: [],
    savedItineraries: [],
  };
  persistAppState(fresh);
  return fresh;
}
