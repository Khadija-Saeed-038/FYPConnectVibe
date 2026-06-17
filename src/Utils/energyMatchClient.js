import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ENERGY_MATCH_BASE_URL,
  ENERGY_MATCH_PROD_BASE_URL,
  ENERGY_MATCH_TOKEN_KEY,
  isEnergyMatchConfigured,
} from '../Config/energyMatch';

export async function getEnergyMatchToken() {
  try {
    const token = await AsyncStorage.getItem(ENERGY_MATCH_TOKEN_KEY);
    if (__DEV__) {
      console.log(
        '[EnergyMatch] getEnergyMatchToken',
        token == null || token === '' ? null : '(present)',
      );
    }
    return token;
  } catch {
    if (__DEV__) {
      console.log('[EnergyMatch] getEnergyMatchToken error');
    }
    return null;
  }
}

export async function setEnergyMatchToken(token) {
  if (token == null || token === '') {
    if (__DEV__) {
      console.log('[EnergyMatch] setEnergyMatchToken cleared');
    }
    await AsyncStorage.removeItem(ENERGY_MATCH_TOKEN_KEY);
    return;
  }
  const value = String(token);
  if (__DEV__) {
    console.log('[EnergyMatch] setEnergyMatchToken', value);
  }
  await AsyncStorage.setItem(ENERGY_MATCH_TOKEN_KEY, value);
}

/**
 * @param {string} path API path under /api, e.g. "/matches/?limit=8" or "/accounts/me/"
 * @param {{ method?: string, body?: object }} [options]
 * @returns {Promise<{ ok: boolean, status: number, data: any, error: string | null }>}
 */
export async function energyMatchRequest(path, options = {}) {
  if (!isEnergyMatchConfigured()) {
    return {
      ok: false,
      status: 0,
      data: null,
      error:
        'Energy Match API URL not set for release. Add ENERGY_MATCH_PROD_BASE_URL in src/Config/energyMatch.local.js (see energyMatch.local.example.js), rebuild the APK, and deploy energy_match_project.',
    };
  }

  const token = await getEnergyMatchToken();
  if (!token) {
    if (__DEV__) {
      console.log('[EnergyMatch] energyMatchRequest NO_TOKEN', path);
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'NO_ENERGY_MATCH_TOKEN',
    };
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${ENERGY_MATCH_BASE_URL}/api${normalized}`;
  const method = options.method || 'GET';
  if (__DEV__) {
    console.log('[EnergyMatch] energyMatchRequest', method, normalized);
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
        ...options.headers,
      },
      body:
        options.body !== undefined && options.body !== null
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch (e) {
    const msg = e?.message || 'NETWORK_ERROR';
    if (__DEV__) {
      console.warn('[EnergyMatch] fetch failed', url, e);
    }
    const hint =
      __DEV__ && msg === 'Network request failed'
        ? `${msg} — Is Django running? Try: cd energy_match_project && python manage.py runserver 0.0.0.0:8000. Base URL: ${ENERGY_MATCH_BASE_URL}. Physical device: set ENERGY_MATCH_DEV_HOST_OVERRIDE in src/Config/energyMatch.js to your PC LAN IP.`
        : !__DEV__ && msg === 'Network request failed'
          ? `${msg} — Check ENERGY_MATCH_PROD_BASE_URL (${ENERGY_MATCH_PROD_BASE_URL || 'not set'}) and that the Django API is deployed and reachable.`
          : msg;
    return {
      ok: false,
      status: 0,
      data: null,
      error: hint,
    };
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      typeof data === 'object' && data !== null && data.detail != null
        ? String(data.detail)
        : typeof data === 'string'
          ? data
          : `HTTP_${res.status}`;
    return {ok: false, status: res.status, data, error: detail};
  }

  return {ok: true, status: res.status, data, error: null};
}
