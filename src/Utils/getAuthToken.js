/**
 * Firebase ID token for the signed-in user (refreshed when possible).
 * Returns null if not signed in.
 */
async function getAuthToken() {
  try {
    const auth = require('@react-native-firebase/auth').default;
    const user = auth().currentUser;
    if (user) {
      return await user.getIdToken(true);
    }
  } catch (e) {
    // Auth module unavailable
  }
  return null;
}

export default getAuthToken;
