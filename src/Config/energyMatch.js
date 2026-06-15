import {Platform} from 'react-native';

/** AsyncStorage key for Django DRF token (`Authorization: Token …`). */
export const ENERGY_MATCH_TOKEN_KEY = 'energyMatchToken';

const DEV_PORT = 8000;

/**
 * When testing on a physical phone (or when the emulator cannot reach the host),
 * set this to your computer's LAN IP, e.g. `192.168.10.5`. Leave empty for defaults.
 * Run Django so it accepts remote connections: `python manage.py runserver 0.0.0.0:8000`
 */
export const ENERGY_MATCH_DEV_HOST_OVERRIDE = '';

/**
 * Base URL for Energy Match Django API (no trailing slash).
 * Android emulator: 10.0.2.2 → host loopback. iOS simulator: 127.0.0.1.
 */
export const ENERGY_MATCH_BASE_URL = (() => {
  if (__DEV__) {
    const host = String(ENERGY_MATCH_DEV_HOST_OVERRIDE || '').trim();
    if (host) {
      return `http://${host}:${DEV_PORT}`;
    }
  }
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${DEV_PORT}`
    : `http://127.0.0.1:${DEV_PORT}`;
})();

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
