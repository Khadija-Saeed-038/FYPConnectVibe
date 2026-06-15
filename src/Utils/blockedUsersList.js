import firestore from '@react-native-firebase/firestore';
import {FIRESTORE_USERS_COLLECTION} from '../Config/firebase';

export function contactLine(profile) {
  if (!profile || typeof profile !== 'object') {
    return '—';
  }
  const phone = String(profile.phone || '').trim();
  if (phone) {
    return phone;
  }
  const email = String(
    profile.email || profile.user_email || '',
  ).trim();
  if (email) {
    return email;
  }
  return '—';
}

/** Phone only — never falls back to email (blocklist, contact info). */
export function phoneLine(profile) {
  if (!profile || typeof profile !== 'object') {
    return 'No phone number';
  }
  const phone = String(profile.phone || '').trim();
  return phone || 'No phone number';
}

export function displayName(profile, fallbackId) {
  if (!profile || typeof profile !== 'object') {
    return fallbackId ? String(fallbackId) : 'Unknown';
  }
  const n = String(profile.name || '').trim();
  return n || (fallbackId ? String(fallbackId) : 'Unknown');
}

export async function fetchUserDoc(userId) {
  const id = String(userId || '').trim();
  if (!id) {
    return null;
  }
  try {
    const snap = await firestore()
      .collection(FIRESTORE_USERS_COLLECTION)
      .doc(id)
      .get();
    if (!snap.exists) {
      return {id, name: '', email: '', phone: ''};
    }
    const d = snap.data() || {};
    return {
      id,
      name: d.name || '',
      email: d.email || d.user_email || '',
      phone: d.phone || '',
    };
  } catch {
    return {id, name: '', email: '', phone: ''};
  }
}

/**
 * @param {Record<string, unknown>} blockedMap RTDB Blocks/{uid}/blocked snapshot value
 * @returns {Promise<Array<{ key: string, title: string, subtitle: string, kind: string }>>}
 */
export async function resolveBlockedMapToRows(blockedMap) {
  const entries = Object.entries(blockedMap || {}).filter(
    ([, v]) => v === true || v === 'true',
  );
  if (entries.length === 0) {
    return [];
  }
  return Promise.all(
    entries.map(async ([key]) => {
      const doc = await fetchUserDoc(key);
      const line = phoneLine(doc);
      const hasContact = line !== 'No phone number';
      const hasName = String(doc?.name || '').trim().length > 0;
      if (hasName || hasContact) {
        return {
          key,
          title: displayName(doc, key),
          subtitle: line,
          kind: 'user',
        };
      }
      const looksLikeThread =
        key.length > 12 && !key.includes('@') && /^[a-zA-Z0-9_-]+$/.test(key);
      return {
        key,
        title: looksLikeThread ? 'Blocked thread' : 'Blocked',
        subtitle: key,
        kind: 'thread',
      };
    }),
  );
}
