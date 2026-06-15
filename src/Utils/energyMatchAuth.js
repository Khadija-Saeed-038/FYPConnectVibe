/**
 * Link Django Energy Match (DRF token) after Firebase email/password auth (plan option A).
 */
import {ENERGY_MATCH_BASE_URL} from '../Config/energyMatch';
import {setEnergyMatchToken} from './energyMatchClient';

function djangoUsernameFromFirebaseUid(email, uid) {
  const local = String(email || 'user')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 20);
  const suffix = String(uid || 'x').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 10);
  const base = (local || 'user') + '_' + (suffix || 'id');
  return base.slice(0, 150);
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function linkEnergyMatchAfterFirebaseLogin(email, password) {
  const url = `${ENERGY_MATCH_BASE_URL}/api/auth/login/`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: String(email || '').trim(),
        password: String(password || ''),
      }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const err =
        (data && data.non_field_errors && data.non_field_errors[0]) ||
        (data && data.detail) ||
        `HTTP_${res.status}`;
      return {ok: false, error: String(err)};
    }
    const token = data && data.token;
    if (!token) {
      return {ok: false, error: 'NO_TOKEN_IN_LOGIN_RESPONSE'};
    }
    await setEnergyMatchToken(token);
    return {ok: true};
  } catch (e) {
    return {ok: false, error: e?.message || 'NETWORK_ERROR'};
  }
}

/**
 * Create Django user + token after Firebase signup. If email exists on Django, tries login.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function linkEnergyMatchAfterFirebaseRegister({
  email,
  password,
  firebaseUid,
}) {
  const em = String(email || '').trim();
  const pw = String(password || '');
  const username = djangoUsernameFromFirebaseUid(em, firebaseUid);
  const signupUrl = `${ENERGY_MATCH_BASE_URL}/api/auth/signup/`;
  const body = {
    username,
    email: em,
    password: pw,
    password_confirm: pw,
  };
  try {
    let res = await fetch(signupUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    let data = await parseJsonResponse(res);
    if (res.ok && data && data.token) {
      await setEnergyMatchToken(data.token);
      return {ok: true};
    }
    const emailErr = Array.isArray(data?.email) ? data.email.join(' ') : '';
    const emailTaken =
      res.status === 400 && emailErr.toLowerCase().includes('already');
    if (emailTaken) {
      return linkEnergyMatchAfterFirebaseLogin(em, pw);
    }
    const err =
      (data && data.email && data.email[0]) ||
      (data && data.username && data.username[0]) ||
      (data && data.detail) ||
      `HTTP_${res.status}`;
    return {ok: false, error: String(err)};
  } catch (e) {
    return {ok: false, error: e?.message || 'NETWORK_ERROR'};
  }
}
