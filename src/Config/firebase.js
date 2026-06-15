/**
 * Firebase client-only stack: Auth + Firestore + Realtime Database.
 * No Express or Cloud Functions HTTP. Add google-services.json (Android) and GoogleService-Info.plist (iOS).
 *
 * Data split (by design):
 * - Firestore: user profiles / search only — see FIRESTORE_USERS_COLLECTION.
 * - Realtime Database: all chat threads under RTDB_MESSAGES_PATH; the room id is
 *   the child key (e.g. sortedUidA_uidB for 1:1). Room ids are NOT written to Firestore.
 */

/** Firestore collection for user profiles, search, FCM device ids. */
export const FIRESTORE_USERS_COLLECTION = 'users';

/** Realtime Database root for chat threads (1:1 and group). Room id = path segment under this root. */
export const RTDB_MESSAGES_PATH = 'Messages';
