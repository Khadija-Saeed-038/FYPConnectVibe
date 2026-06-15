/**
 * Firestore user search uses lowercase prefix fields on `users/{uid}`.
 * Keep in sync with writes in Register, Login, EditProfile, and patch-on-login.
 */
export function buildSearchIndexFields(name, email) {
  const nameLower = String(name || '').trim().toLowerCase();
  const emailLower = String(email || '').trim().toLowerCase();
  return {nameLower, emailLower};
}
