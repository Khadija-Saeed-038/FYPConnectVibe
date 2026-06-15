/**
 * Mirror Firestore user fields onto Django UserProfile for GET /api/matches/.
 */
import {energyMatchRequest, getEnergyMatchToken} from './energyMatchClient';

const VALID_MOODS = new Set([
  'happy',
  'calm',
  'energetic',
  'neutral',
  'sad',
  'anxious',
  'angry',
]);

const VALID_AVAILABILITY = new Set(['available', 'busy', 'away']);

/**
 * @param {Record<string, unknown>} firestoreDoc
 * @returns {Promise<{ ok: boolean, skipped?: boolean, error?: string }>}
 */
export async function syncEnergyMatchProfileFromFirestoreDoc(firestoreDoc) {
  const token = await getEnergyMatchToken();
  if (!token) {
    return {ok: false, error: 'NO_ENERGY_MATCH_TOKEN'};
  }
  if (!firestoreDoc || typeof firestoreDoc !== 'object') {
    return {ok: true, skipped: true};
  }

  const patch = {};
  const mood = String(firestoreDoc.mood || '')
    .trim()
    .toLowerCase();
  if (mood && VALID_MOODS.has(mood)) {
    patch.mood = mood;
  }
  const availability = String(firestoreDoc.availability || '')
    .trim()
    .toLowerCase();
  if (availability && VALID_AVAILABILITY.has(availability)) {
    patch.availability = availability;
  }

  if (Object.keys(patch).length === 0) {
    return {ok: true, skipped: true};
  }

  return energyMatchRequest('/accounts/me/', {method: 'PATCH', body: patch});
}
