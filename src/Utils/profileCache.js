/**
 * Client-side cache for profile metadata: mood, interests, and chat_metadata.
 * Matches backend cache behaviour (GET profile uses cache; PATCH invalidates).
 * Uses in-memory TTL cache; optional AsyncStorage for persistence across restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@ConnectVibe_profile_';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes (align with backend)

// In-memory cache: userId -> { value, expiresAt }
const memory = new Map();

/**
 * Get cache key for a user's profile metadata.
 * @param {string} userId
 * @returns {string}
 */
function cacheKey(userId) {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

/**
 * Get cached profile (mood, interests, chat_metadata and rest of profile) if valid.
 * @param {string} userId
 * @returns {Promise<object|null>} Cached profile payload or null.
 */
export async function getCachedProfile(userId) {
  if (!userId) return null;
  const key = cacheKey(userId);
  const entry = memory.get(key);
  if (entry && Date.now() <= entry.expiresAt) {
    return entry.value;
  }
  if (entry) memory.delete(key);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (stored.expiresAt && Date.now() > stored.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    const value = stored.value || null;
    if (value) memory.set(key, { value, expiresAt: stored.expiresAt });
    return value;
  } catch {
    return null;
  }
}

/**
 * Store profile in cache (mood, interests, chat_metadata and full profile).
 * @param {string} userId
 * @param {object} profilePayload Full profile object from Firestore (users/{uid})
 * @param {number} [ttlMs]
 */
export async function setCachedProfile(userId, profilePayload, ttlMs = DEFAULT_TTL_MS) {
  if (!userId || !profilePayload) return;
  const key = cacheKey(userId);
  const expiresAt = Date.now() + ttlMs;
  memory.set(key, { value: profilePayload, expiresAt });
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ value: profilePayload, expiresAt }));
  } catch (_) {}
}

/**
 * Invalidate cache for a user (e.g. after PATCH profile).
 * @param {string} userId
 */
export async function invalidateProfile(userId) {
  if (!userId) return;
  const key = cacheKey(userId);
  memory.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch (_) {}
}

export { DEFAULT_TTL_MS };
