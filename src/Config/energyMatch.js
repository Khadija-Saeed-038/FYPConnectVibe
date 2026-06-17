import {Platform} from 'react-native';

/** AsyncStorage key for Django DRF token (`Authorization: Token …`). */
export const ENERGY_MATCH_TOKEN_KEY = 'energyMatchToken';

const DEV_PORT = 8000;

/**
 * Production API URL (HTTPS, no trailing slash).
 * Set here OR in gitignored `energyMatch.local.js` before `yarn build` / release APK.
 * Example: `https://connectvibe-energy.onrender.com`
 */
const COMMITTED_PROD_BASE_URL = '';

let localProdBaseUrl = '';
try {
  const local = require('./energyMatch.local');
  localProdBaseUrl = String(local.ENERGY_MATCH_PROD_BASE_URL || '').trim();
} catch {
  // Optional: src/Config/energyMatch.local.js (see energyMatch.local.example.js)
}

/** Resolved production base URL used in release builds. */
export const ENERGY_MATCH_PROD_BASE_URL =
  localProdBaseUrl || String(COMMITTED_PROD_BASE_URL || '').trim();

/**
 * When testing on a physical phone in dev, set your computer's LAN IP, e.g. `192.168.10.5`.
 * Run Django: `python manage.py runserver 0.0.0.0:8000`
 */
export const ENERGY_MATCH_DEV_HOST_OVERRIDE = '';

function resolveDevBaseUrl() {
  const host = String(ENERGY_MATCH_DEV_HOST_OVERRIDE || '').trim();
  if (host) {
    return `http://${host}:${DEV_PORT}`;
  }
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${DEV_PORT}`
    : `http://127.0.0.1:${DEV_PORT}`;
}

function resolveReleaseBaseUrl() {
  const prod = ENERGY_MATCH_PROD_BASE_URL.replace(/\/$/, '');
  if (prod) {
    return prod;
  }
  // Emulator-only fallback when prod URL not set yet (physical devices need ENERGY_MATCH_PROD_BASE_URL)
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${DEV_PORT}`
    : `http://127.0.0.1:${DEV_PORT}`;
}

/**
 * Base URL for Energy Match Django API (no trailing slash).
 */
export const ENERGY_MATCH_BASE_URL = __DEV__
  ? resolveDevBaseUrl()
  : resolveReleaseBaseUrl();

/** False in release when no production URL is configured (physical APK will not reach Django). */
export function isEnergyMatchConfigured() {
  if (__DEV__) {
    return true;
  }
  return ENERGY_MATCH_PROD_BASE_URL.length > 0;
}

/** Mirrors energy_match_project.accounts.models.Mood */
export const ENERGY_MOOD_CHOICES = [
  {value: 'happy', label: 'Happy'},
  {value: 'calm', label: 'Calm'},
  {value: 'energetic', label: 'Energetic'},
  {value: 'neutral', label: 'Neutral'},
  {value: 'sad', label: 'Sad'},
  {value: 'anxious', label: 'Anxious'},
  {value: 'angry', label: 'Angry'},
];
