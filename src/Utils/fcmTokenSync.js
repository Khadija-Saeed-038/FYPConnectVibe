import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {FIRESTORE_USERS_COLLECTION} from '../Config/firebase';

/** Persist device FCM token on the signed-in user's Firestore profile. */
export async function syncFcmTokenToFirestore(token, platform = 'unknown') {
  if (!token) {
    return;
  }
  const uid = auth().currentUser?.uid;
  if (!uid) {
    return;
  }
  await firestore()
    .collection(FIRESTORE_USERS_COLLECTION)
    .doc(uid)
    .set(
      {
        devices: firestore.FieldValue.arrayUnion(String(token)),
        lastFcmToken: String(token),
        lastFcmPlatform: platform,
      },
      {merge: true},
    );
}
