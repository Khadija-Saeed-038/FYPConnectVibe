import {call, put, all, takeLatest, spawn} from 'redux-saga/effects';

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

const SIGNUP_TIMEOUT_MS = 30000;
const FIRESTORE_WRITE_TIMEOUT_MS = 15000;

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

function withTimeout(promise, ms, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        Object.assign(new Error(timeoutMessage), {
          code: 'auth/timeout',
        }),
      );
    }, ms);
    Promise.resolve(promise)
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function saveUserProfileToFirestore(uid, profile) {
  const firestore = require('@react-native-firebase/firestore').default;
  const displayName = profile.displayName || profile.name || 'User';
  const email = String(profile.email || '').trim();
  const phone = String(profile.phone || '').trim();
  const searchIdx = buildSearchIndexFields(displayName, email);
  await firestore()
    .collection(FIRESTORE_USERS_COLLECTION)
    .doc(uid)
    .set(
      {
        id: uid,
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
      },
      {merge: true},
    );
}

async function createAuthUser(data) {
  const auth = require('@react-native-firebase/auth').default;
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

  await u.getIdToken(true);
  const token = await u.getIdToken();
  await AsyncStorage.setItem('accessToken', token);

  const displayName = name || email.split('@')[0];
  return {
    data: {
      token,
      user: {
        id: u.uid,
        name: displayName,
        email,
        phone,
        profile_image: null,
      },
    },
    uid: u.uid,
    profile: {displayName, email, phone},
  };
}

async function createAuthUserWithTimeout(data) {
  return withTimeout(
    createAuthUser(data),
    SIGNUP_TIMEOUT_MS,
    'Registration timed out. Check internet and try again.',
  );
}

async function persistSignupProfile(uid, profile) {
  try {
    await withTimeout(
      saveUserProfileToFirestore(uid, profile),
      FIRESTORE_WRITE_TIMEOUT_MS,
      'Firestore profile save timed out',
    );
  } catch (e) {
    if (__DEV__) {
      console.warn('[Register] Firestore profile save failed (login will retry):', e);
    }
  }
}

async function linkEnergyMatchAfterSignup({email, password, firebaseUid}) {
  try {
    let finalLink = await linkEnergyMatchAfterFirebaseRegister({
      email,
      password,
      firebaseUid,
    });
    if (!finalLink.ok) {
      finalLink = await linkEnergyMatchAfterFirebaseRegister({
        email,
        password,
        firebaseUid,
      });
    }
    if (finalLink.ok) {
      const sync = await syncEnergyMatchProfileFromFirestoreDoc({
        availability: 'available',
      });
      if (!sync.ok && sync.error !== 'NO_ENERGY_MATCH_TOKEN' && __DEV__) {
        console.warn('[EnergyMatch] profile sync after signup:', sync.error);
      }
    } else if (__DEV__) {
      console.warn('[EnergyMatch] Django link after Firebase signup:', finalLink.error);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[EnergyMatch] signup link error:', e);
    }
  }
}

function* handleSignupError(e) {
  const code = String(e?.code || '');
  const msg = String(e?.message || '');

  if (__DEV__) {
    console.warn('[Register]', code || 'error', msg, e);
  }

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
  if (
    code === 'auth/operation-not-allowed' ||
    msg.includes('operation-not-allowed')
  ) {
    yield put(signupFailure({data: {detail: code}}));
    Toast.show(
      'Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    );
    return;
  }
  if (
    code === 'auth/network-request-failed' ||
    code === 'auth/timeout' ||
    msg.toLowerCase().includes('timed out')
  ) {
    yield put(signupFailure({data: {detail: msg || code}}));
    Toast.show(msg || 'Network error. Check your connection and try again.');
    return;
  }
  const permDenied =
    code.includes('firestore') ||
    code === 'firestore/permission-denied' ||
    /permission-denied|PERMISSION_DENIED/i.test(msg);
  if (permDenied) {
    yield put(signupFailure({data: {detail: code || msg}}));
    Toast.show(
      'Firestore blocked this save. Deploy firestore.rules or allow users/{uid} writes in Firebase Console.',
    );
    return;
  }
  if (code.includes('unavailable') || msg.toLowerCase().includes('network')) {
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

function* signupAPiCall({data, callBack}) {
  try {
    const result = yield call(createAuthUserWithTimeout, data);
    const payload = result.data;
    const fields = payloadToSignupFields(data);

    yield put(signupSuccess({user: payload.user}));
    yield put(loginSuccess(payload));

    yield spawn(persistSignupProfile, result.uid, result.profile);
    yield spawn(linkEnergyMatchAfterSignup, {
      email: fields.email,
      password: fields.password,
      firebaseUid: payload.user?.id,
    });

    yield call(persistFirebaseAccessToken, true);
    yield call(cacheEnergyMatchCredentials, fields.email, fields.password);

    callBack();
    Toast.show('User created successfully');
  } catch (e) {
    yield* handleSignupError(e);
  }
}

export default all([takeLatest(SIGNUP, signupAPiCall)]);
