import AsyncStorage from '@react-native-async-storage/async-storage';
import {getEnergyMatchToken} from './energyMatchClient';
import {linkEnergyMatchAfterFirebaseLogin} from './energyMatchAuth';

const ACCESS_TOKEN_KEY = 'accessToken';
const ENERGY_MATCH_EMAIL_KEY = 'energyMatchEmail';
const ENERGY_MATCH_PASSWORD_KEY = 'energyMatchPassword';

let recoveringToken = false;

export async function persistFirebaseAccessToken(forceRefresh = true) {
  try {
    const auth = require('@react-native-firebase/auth').default;
    const user = auth().currentUser;
    if (!user) {
      return {ok: false, error: 'NO_FIREBASE_USER'};
    }
    const token = await user.getIdToken(!!forceRefresh);
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, String(token || ''));
    return {ok: true, token};
  } catch (e) {
    return {ok: false, error: e?.message || 'FIREBASE_TOKEN_PERSIST_FAILED'};
  }
}

export async function cacheEnergyMatchCredentials(email, password) {
  const em = String(email || '').trim();
  const pw = String(password || '');
  if (!em || !pw) {
    return {ok: false, error: 'MISSING_EMAIL_OR_PASSWORD'};
  }
  await AsyncStorage.multiSet([
    [ENERGY_MATCH_EMAIL_KEY, em],
    [ENERGY_MATCH_PASSWORD_KEY, pw],
  ]);
  return {ok: true};
}

async function readCachedCredentials() {
  const pairs = await AsyncStorage.multiGet([
    ENERGY_MATCH_EMAIL_KEY,
    ENERGY_MATCH_PASSWORD_KEY,
  ]);
  const email = String(pairs?.[0]?.[1] || '').trim();
  const password = String(pairs?.[1]?.[1] || '');
  if (!email || !password) {
    return null;
  }
  return {email, password};
}

export async function recoverEnergyMatchTokenSilently(options = {}) {
  if (recoveringToken) {
    return {ok: false, error: 'RECOVERY_IN_PROGRESS'};
  }
  const retryOnce = options.retryOnce !== false;
  const delayMs = Number(options.retryDelayMs || 1200);
  recoveringToken = true;
  try {
    const existingToken = await getEnergyMatchToken();
    if (existingToken) {
      return {ok: true, skipped: true};
    }
    const creds = await readCachedCredentials();
    if (!creds) {
      return {ok: false, error: 'NO_CACHED_ENERGY_MATCH_CREDENTIALS'};
    }
    let link = await linkEnergyMatchAfterFirebaseLogin(creds.email, creds.password);
    if (!link.ok && retryOnce) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      link = await linkEnergyMatchAfterFirebaseLogin(creds.email, creds.password);
    }
    return link;
  } finally {
    recoveringToken = false;
  }
}

export async function bootstrapEnergyMatchSession() {
  const firebase = await persistFirebaseAccessToken(true);
  if (!firebase.ok) {
    return {ok: false, error: firebase.error};
  }
  const token = await getEnergyMatchToken();
  if (token) {
    return {ok: true, skipped: true};
  }
  return recoverEnergyMatchTokenSilently({retryOnce: true});
}
