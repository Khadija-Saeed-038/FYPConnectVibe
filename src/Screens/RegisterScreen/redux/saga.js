import {call, put, all, takeLatest} from 'redux-saga/effects';

import {SIGNUP} from './types';
import {FIRESTORE_USERS_COLLECTION} from '../../../Config/firebase';
import {buildSearchIndexFields} from '../../../Utils/userSearchIndex';
import {linkEnergyMatchAfterFirebaseRegister} from '../../../Utils/energyMatchAuth';
import {syncEnergyMatchProfileFromFirestoreDoc} from '../../../Utils/energyMatchProfileSync';
import {
  cacheEnergyMatchCredentials,
  persistFirebaseAccessToken,
} from '../../../Utils/energyMatchSession';

import {Toast} from 'react-native-toast-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {signupSuccess, signupFailure} from './action';
import {loginSuccess} from '../../LoginScreen/redux/actions';

function payloadToSignupFields(data) {
  if (data && typeof data === 'object' && !data._parts) {
    return {
      name: String(data.name || 'User').trim(),
      email: String(data.email || '').trim(),
      phone: String(data.phone || data.phone_no || '').trim(),
      password: String(data.password || '').trim(),
    };
  }
  const obj = {};
  if (data && data._parts) {
    data._parts.forEach(([key, value]) => {
      obj[key] = value;
    });
  }
  return {
    name: String(obj.name || obj.username || 'User').trim(),
    email: String(obj.email || '').trim(),
    phone: String(obj.phone || obj.phone_no || '').trim(),
    password: String(obj.password || '').trim(),
  };
}

async function signupApi(data) {
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;
  const {name, email, phone, password} = payloadToSignupFields(data);

  if (!email) {
    throw {response: {data: {email: ['This field is required.']}}};
  }
  if (!phone) {
    throw {response: {data: {phone: ['This field is required.']}}};
  }
  if (!password) {
    throw {response: {data: {password: ['This field is required.']}}};
  }

  const userCred = await auth().createUserWithEmailAndPassword(email, password);
  const u = userCred.user;
  if (name) {
    try {
      await u.updateProfile({displayName: name});
    } catch (e) {
      /* non-fatal */
    }
  }

  // Ensure Auth token is propagated to the Firestore client before first write (avoids permission-denied right after sign-up).
  await u.getIdToken(true);

  if (__DEV__) {
    const cur = auth().currentUser;
    console.warn(
      '[Register] Firestore path:',
      `${FIRESTORE_USERS_COLLECTION}/${u.uid}`,
      '| auth().currentUser?.uid === doc uid:',
      cur?.uid === u.uid,
      '| project from native config should be connectvibe-5a547 (see google-services.json)',
    );
  }

  const displayName = name || email.split('@')[0];
  const searchIdx = buildSearchIndexFields(displayName, email);
  try {
    await firestore()
      .collection(FIRESTORE_USERS_COLLECTION)
      .doc(u.uid)
      .set({
        id: u.uid,
        name: displayName,
        email,
        user_email: email,
        phone,
        active: true,
        mood: '',
        interests: '',
        profile_image: null,
        devices: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
        ...searchIdx,
      });
  } catch (firestoreErr) {
    try {
      await u.delete();
    } catch (delErr) {
      /* ignore */
    }
    throw firestoreErr;
  }

  const token = await u.getIdToken();
  await AsyncStorage.setItem('accessToken', token);
  const user = {
    id: u.uid,
    name: name || email.split('@')[0],
    email,
    phone,
    profile_image: null,
  };
  return {data: {token, user}};
}

function* signupAPiCall({data, callBack}) {
  try {
    const response = yield call(signupApi, data);
    const payload = response.data;
    yield call(persistFirebaseAccessToken, true);
    yield put(signupSuccess({user: payload.user}));
    yield put(loginSuccess(payload));
    const fields = payloadToSignupFields(data);
    yield call(cacheEnergyMatchCredentials, fields.email, fields.password);
    let finalLink = yield call(linkEnergyMatchAfterFirebaseRegister, {
      email: fields.email,
      password: fields.password,
      firebaseUid: payload.user?.id,
    });
    if (!finalLink.ok && __DEV__) {
      console.warn('[EnergyMatch] Django link after Firebase signup:', finalLink.error);
    }
    if (!finalLink.ok) {
      finalLink = yield call(linkEnergyMatchAfterFirebaseRegister, {
        email: fields.email,
        password: fields.password,
        firebaseUid: payload.user?.id,
      });
      if (!finalLink.ok && __DEV__) {
        console.warn('[EnergyMatch] retry link after Firebase signup:', finalLink.error);
      }
    }
    if (finalLink.ok) {
      const sync = yield call(syncEnergyMatchProfileFromFirestoreDoc, {
        availability: 'available',
      });
      if (!sync.ok && sync.error !== 'NO_ENERGY_MATCH_TOKEN' && __DEV__) {
        console.warn('[EnergyMatch] profile sync after signup:', sync.error);
      }
    }
    callBack();
    Toast.show('User created successfully');
  } catch (e) {
    const code = String(e?.code || '');
    const msg = String(e?.message || '');
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      yield put(signupFailure({data: {email: ['Email already in use']}}));
      Toast.show('Email already in use');
      return;
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      yield put(signupFailure({data: {password: ['Password is too weak']}}));
      Toast.show('Password is too weak');
      return;
    }
    const permDenied =
      code.includes('firestore') ||
      code === 'firestore/permission-denied' ||
      /permission-denied|PERMISSION_DENIED/i.test(msg) ||
      msg.toLowerCase().includes('permission');
    if (permDenied) {
      if (__DEV__) {
        console.warn('[Register Firestore]', code, msg, e);
      }
      yield put(signupFailure({data: {detail: code || msg}}));
      Toast.show(
        'Firestore blocked this save. In Firebase Console: Firestore Database must exist; Rules must allow users/{uid} write for request.auth.uid == uid; turn OFF App Check enforcement for Firestore if you enabled it without the app SDK.',
      );
      return;
    }
    if (msg.toLowerCase().includes('network') || code.includes('unavailable')) {
      yield put(signupFailure({data: {detail: msg}}));
      Toast.show('Network error. Check connection and try again.');
      return;
    }
    const {response} = e;
    yield put(signupFailure(response));
    if (response?.data?.email) {
      Toast.show(response?.data?.email[0]);
    } else if (response?.data?.phone) {
      Toast.show(response?.data?.phone[0]);
    } else if (msg) {
      Toast.show(msg.length > 120 ? 'Something went wrong' : msg);
    } else {
      Toast.show('Something went wrong');
    }
  }
}

export default all([takeLatest(SIGNUP, signupAPiCall)]);
