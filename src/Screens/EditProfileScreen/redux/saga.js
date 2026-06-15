import {call, put, select, takeLatest, all} from 'redux-saga/effects';
import {UPDATE_PROFILE, GET_PROFILE} from './types';
import {
  updateProfileSuccess,
  updateProfileFailure,
  getProfileSuccess,
  getProfileFailure,
} from './actions';
import {FIRESTORE_USERS_COLLECTION} from '../../../Config/firebase';
import {buildSearchIndexFields} from '../../../Utils/userSearchIndex';
import {syncEnergyMatchProfileFromFirestoreDoc} from '../../../Utils/energyMatchProfileSync';
import {
  getCachedProfile,
  setCachedProfile,
  invalidateProfile,
} from '../../../Utils/profileCache';

function docToProfile(uid, d) {
  if (!d) {
    return {
      id: uid,
      name: '',
      user_email: '',
      phone: '',
      mood: '',
      interests: '',
      chat_metadata: {},
      profile_image: null,
    };
  }
  return {
    id: uid,
    name: d.name || '',
    user_email: d.user_email || d.email || '',
    phone: d.phone || '',
    mood: d.mood || '',
    interests: d.interests || '',
    chat_metadata: d.chat_metadata || {},
    profile_image: null,
  };
}

/** Empty / missing-doc shape — do not cache or treat as authoritative over Redux + login. */
function isTrivialProfile(p) {
  if (!p || typeof p !== 'object') {
    return true;
  }
  const name = String(p.name || '').trim();
  const email = String(p.user_email || p.email || '').trim();
  const phone = String(p.phone || '').trim();
  return !name && !email && !phone;
}

/**
 * Fill holes in server/cached profile from last Redux profile and login user so
 * reopening Edit Profile after goBack does not wipe the form.
 */
function enrichProfileFromSources(serverProfile, prevProfile, loginUser) {
  const uid =
    (serverProfile && serverProfile.id) ||
    (prevProfile && prevProfile.id) ||
    loginUser?.id ||
    '';
  const base =
    serverProfile && typeof serverProfile === 'object'
      ? {...serverProfile}
      : docToProfile(uid, null);
  if (!base.id) {
    base.id = uid;
  }

  const fill = src => {
    if (!src || typeof src !== 'object') {
      return;
    }
    if (!String(base.name || '').trim() && src.name) {
      base.name = src.name;
    }
    const em = String(src.user_email || src.email || '').trim();
    if (!String(base.user_email || base.email || '').trim() && em) {
      base.user_email = em;
    }
    if (
      !String(base.phone || '').trim() &&
      src.phone != null &&
      String(src.phone).trim()
    ) {
      base.phone = String(src.phone);
    }
  };

  fill(prevProfile);
  fill(loginUser);
  return base;
}

async function fetchProfileFromFirestore(userId) {
  const firestore = require('@react-native-firebase/firestore').default;
  const snap = await firestore()
    .collection(FIRESTORE_USERS_COLLECTION)
    .doc(userId)
    .get();
  if (!snap.exists) {
    return docToProfile(userId, null);
  }
  return docToProfile(userId, snap.data());
}

/**
 * GET profile with client-side cache; otherwise load from Firestore.
 */
async function getProfileApi(data) {
  const userId = data?.id;
  if (userId) {
    const cached = await getCachedProfile(userId);
    if (cached && !isTrivialProfile(cached)) {
      return {data: cached};
    }
    if (cached && isTrivialProfile(cached)) {
      await invalidateProfile(userId);
    }
  }

  const profileData = await fetchProfileFromFirestore(data.id);
  if (userId && profileData && !isTrivialProfile(profileData)) {
    await setCachedProfile(userId, profileData);
  }
  return {data: profileData};
}

function parseUpdatePayload(data) {
  if (data && data._parts) {
    const o = {};
    data._parts.forEach(([k, v]) => {
      o[k] = v;
    });
    return o;
  }
  return data || {};
}

/**
 * Update Firestore user doc; optional password via Firebase Auth.
 */
async function updateProfileApi(data) {
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;
  const p = parseUpdatePayload(data);
  const userId = p.id;
  if (!userId) {
    throw {response: {data: {detail: 'Missing user id'}}};
  }

  const updates = {};
  if (p.name != null && p.name !== '') {
    updates.name = p.name;
    updates.nameLower = buildSearchIndexFields(p.name, '').nameLower;
  }
  if (p.phone != null) {
    updates.phone = p.phone;
  }

  if (Object.keys(updates).length > 0) {
    await firestore()
      .collection(FIRESTORE_USERS_COLLECTION)
      .doc(userId)
      .update(updates);
  }

  const newPassword = p.new_password || p.password;
  if (newPassword) {
    const u = auth().currentUser;
    if (u) {
      await u.updatePassword(newPassword);
    }
  }

  await invalidateProfile(userId);
  const profileData = await fetchProfileFromFirestore(userId);
  if (userId && profileData && !isTrivialProfile(profileData)) {
    await setCachedProfile(userId, profileData);
  }
  return {data: profileData};
}

function* getProfileApiCall({data}) {
  try {
    const prevProfile = yield select(s => s.editProfile.profile);
    const loginUser = yield select(s => s.login?.userDetail?.user);
    const response = yield call(getProfileApi, data);
    const prev =
      prevProfile && typeof prevProfile === 'object' ? prevProfile : null;
    const enriched = enrichProfileFromSources(
      response.data,
      prev,
      loginUser,
    );
    yield put(getProfileSuccess(enriched));
  } catch (e) {
    const {response} = e;
    yield put(getProfileFailure(response));
  }
}

function* updateProfileApiCall({data}) {
  try {
    const loginUser = yield select(s => s.login?.userDetail?.user);
    const response = yield call(updateProfileApi, data);
    const enriched = enrichProfileFromSources(response.data, null, loginUser);
    yield put(updateProfileSuccess(enriched));
    const sync = yield call(syncEnergyMatchProfileFromFirestoreDoc, {
      mood: enriched.mood,
      availability: enriched.availability,
    });
    if (!sync.ok && sync.error !== 'NO_ENERGY_MATCH_TOKEN' && __DEV__) {
      console.warn('[EnergyMatch] profile sync after edit profile:', sync.error);
    }
  } catch (e) {
    const {response} = e;
    yield put(updateProfileFailure(response));
  }
}

export default all([
  takeLatest(GET_PROFILE, getProfileApiCall),
  takeLatest(UPDATE_PROFILE, updateProfileApiCall),
]);
