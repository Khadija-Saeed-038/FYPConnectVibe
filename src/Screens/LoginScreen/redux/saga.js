import {all, call, put, takeLatest} from 'redux-saga/effects';
import {Toast} from 'react-native-toast-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

import {FIRESTORE_USERS_COLLECTION} from '../../../Config/firebase';
import {buildSearchIndexFields} from '../../../Utils/userSearchIndex';
import {linkEnergyMatchAfterFirebaseLogin} from '../../../Utils/energyMatchAuth';
import {syncEnergyMatchProfileFromFirestoreDoc} from '../../../Utils/energyMatchProfileSync';
import {
  cacheEnergyMatchCredentials,
  persistFirebaseAccessToken,
} from '../../../Utils/energyMatchSession';
import {persistAndSyncToken} from '../../../Utils/notification';

import {
  loginFailure,
  loginSuccess,
  facebookLoginFailure,
  googleLoginFailure,
  accountDisableSuccess,
  accountDisableFailure,
} from './actions';

import {LOGIN, FACEBOOK_LOGIN, GOOGLE_LOGIN, ACCOUNT_DISABLE} from './types';

async function fetchFirestoreUser(uid) {
  const firestore = require('@react-native-firebase/firestore').default;
  const ref = firestore().collection(FIRESTORE_USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return {};
  }
  return snap.data();
}

/** Backfill `nameLower` / `emailLower` for accounts created before search indexing. */
async function patchUserSearchIndexIfNeeded(uid, doc) {
  if (!uid || !doc || typeof doc !== 'object') {
    return doc;
  }
  const {nameLower, emailLower} = buildSearchIndexFields(
    doc.name,
    doc.email || doc.user_email,
  );
  if (doc.nameLower === nameLower && doc.emailLower === emailLower) {
    return doc;
  }
  const firestore = require('@react-native-firebase/firestore').default;
  await firestore()
    .collection(FIRESTORE_USERS_COLLECTION)
    .doc(uid)
    .update({nameLower, emailLower});
  return {...doc, nameLower, emailLower};
}

async function ensureUserDoc(uid, email, displayName) {
  const firestore = require('@react-native-firebase/firestore').default;
  const ref = firestore().collection(FIRESTORE_USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    return snap.data();
  }
  const name = displayName || (email && email.split('@')[0]) || 'User';
  const searchIdx = buildSearchIndexFields(name, email);
  const payload = {
    id: uid,
    name,
    email,
    user_email: email,
    phone: '',
    active: true,
    mood: '',
    interests: '',
    profile_image: null,
    devices: [],
    createdAt: firestore.FieldValue.serverTimestamp(),
    ...searchIdx,
  };
  await ref.set(payload);
  return payload;
}

function buildUserPayload(u, email, doc) {
  const e = doc.email || doc.user_email || u.email || email || '';
  return {
    id: u.uid,
    name: doc.name || u.displayName || (e && e.split('@')[0]) || 'User',
    email: e,
    phone: doc.phone || '',
    profile_image: null,
  };
}

async function loginAPi(data) {
  const auth = require('@react-native-firebase/auth').default;
  const payload = data || {};
  // Login screen uses react-hook-form field name "username" for the email address.
  const email = (payload.email || payload.username || '').trim();
  const password = payload.password || '';
  if (!email || !password) {
    throw Object.assign(new Error('Invalid'), {
      response: {data: {non_field_errors: ['Must include email and password.']}},
    });
  }
  const userCred = await auth().signInWithEmailAndPassword(email, password);
  await userCred.user.getIdToken(true);
  const token = await userCred.user.getIdToken();
  const u = userCred.user;
  let doc = await fetchFirestoreUser(u.uid);
  if (!doc || Object.keys(doc).length === 0) {
    doc = await ensureUserDoc(u.uid, u.email || email, u.displayName);
  } else {
    doc = await patchUserSearchIndexIfNeeded(u.uid, doc);
  }
  const profile = buildUserPayload(u, email, doc);
  return {data: {token, user: profile}, firestoreDoc: doc};
}

async function facebookLoginAPi() {
  throw Object.assign(new Error('Email only'), {
    response: {data: {detail: 'Use email and password to sign in.'}},
  });
}

async function googleLoginAPi() {
  throw Object.assign(new Error('Email only'), {
    response: {data: {detail: 'Use email and password to sign in.'}},
  });
}

async function accountDisableAPi(data) {
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;
  const uid = data.id;
  await firestore()
    .collection(FIRESTORE_USERS_COLLECTION)
    .doc(uid)
    .update({active: false});
  try {
    if (auth().currentUser) {
      await auth().currentUser.delete();
    }
  } catch (e) {
    await auth().signOut();
  }
  return {data: {message: 'Account deactivated'}};
}

function* loginApiCall({data, fcmToken}) {
  try {
    const response = yield call(loginAPi, data);
    if (response?.data?.token) {
      const persisted = yield call(persistFirebaseAccessToken, true);
      if (!persisted.ok) {
        yield call([AsyncStorage, 'setItem'], 'accessToken', response.data.token);
      }
      yield put(loginSuccess(response.data));
      const email = (
        data?.email ||
        data?.username ||
        ''
      ).trim();
      const password = data?.password || '';
      if (email && password) {
        yield call(cacheEnergyMatchCredentials, email, password);
        let finalLink = yield call(linkEnergyMatchAfterFirebaseLogin, email, password);
        if (!finalLink.ok && __DEV__) {
          console.warn('[EnergyMatch] Django link after Firebase login:', finalLink.error);
        }
        if (!finalLink.ok) {
          const retryLink = yield call(linkEnergyMatchAfterFirebaseLogin, email, password);
          if (!retryLink.ok && __DEV__) {
            console.warn(
              '[EnergyMatch] retry link after Firebase login:',
              retryLink.error,
            );
          }
          finalLink = retryLink;
        }
        if (finalLink.ok) {
          const sync = yield call(
            syncEnergyMatchProfileFromFirestoreDoc,
            response.firestoreDoc || {},
          );
          if (!sync.ok && sync.error !== 'NO_ENERGY_MATCH_TOKEN' && __DEV__) {
            console.warn('[EnergyMatch] profile sync:', sync.error);
          }
        }
      }
      if (fcmToken) {
        yield call(persistAndSyncToken, fcmToken, Platform.OS);
      } else {
        const stored = yield call([AsyncStorage, 'getItem'], 'FCMToken');
        if (stored) {
          yield call(persistAndSyncToken, stored, Platform.OS);
        }
      }
    }
  } catch (e) {
    const code = e?.code;
    const response = e?.response;
    if (__DEV__) {
      console.error('[Login] failure', code || '(no code)', e?.message, e);
    }
    yield put(loginFailure(response || {data: {}}));
    if (
      code === 'auth/invalid-email' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential'
    ) {
      Toast.show('Invalid email or password');
    } else if (response?.data?.non_field_errors) {
      Toast.show(String(response.data.non_field_errors));
    } else if (code === 'auth/network-request-failed') {
      Toast.show('Network error. Check your connection and try again.');
    } else if (code === 'auth/too-many-requests') {
      Toast.show('Too many attempts. Try again later.');
    } else if (code === 'permission-denied' || code === 'firestore/permission-denied') {
      Toast.show('Could not load your profile. Check Firestore rules for the Users collection.');
    } else if (__DEV__) {
      const detail = e?.message || code || 'Unknown error';
      Toast.show(`Something went wrong: ${detail}`, Toast.LONG);
    } else {
      Toast.show('Something went wrong');
    }
  }
}

function* facebookLoginApiCall() {
  try {
    yield call(facebookLoginAPi);
  } catch (e) {
    const {response} = e;
    yield put(facebookLoginFailure(response));
    Toast.show('Use email and password to sign in');
  }
}

function* googleLoginApiCall() {
  try {
    yield call(googleLoginAPi);
  } catch (e) {
    const {response} = e;
    yield put(googleLoginFailure(response));
    Toast.show('Use email and password to sign in');
  }
}

function* accountDisableApiCall({data, hideModal}) {
  try {
    const response = yield call(accountDisableAPi, data);
    hideModal();
    yield put(accountDisableSuccess(response.data));
  } catch (e) {
    const {response} = e;
    yield put(accountDisableFailure(response));
    Toast.show('Could not deactivate account');
  }
}

export default all([
  takeLatest(LOGIN, loginApiCall),
  takeLatest(FACEBOOK_LOGIN, facebookLoginApiCall),
  takeLatest(GOOGLE_LOGIN, googleLoginApiCall),
  takeLatest(ACCOUNT_DISABLE, accountDisableApiCall),
]);
