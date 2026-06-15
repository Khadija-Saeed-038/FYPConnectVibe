import {call, put, takeLatest, all} from 'redux-saga/effects';
import {GET_USER} from './types';
import {FIRESTORE_USERS_COLLECTION} from '../../../Config/firebase';
import {getUserSuccess, getUserFailure} from './action';

function mapDocToUser(docId, d) {
  const img = d.profile_image;
  return {
    id: docId,
    name: d.name || '',
    email: d.email || d.user_email || '',
    phone: d.phone || '',
    profile_image: typeof img === 'string' && img ? img : null,
  };
}

const SEARCH_RESULT_LIMIT = 25;

async function getUserApi(searchTerm) {
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;
  const uid = auth().currentUser?.uid;
  const q = (searchTerm || '').trim();
  const coll = firestore().collection(FIRESTORE_USERS_COLLECTION);

  if (!q) {
    let snap = await coll.orderBy('createdAt', 'desc').limit(100).get();
    if (snap.empty) {
      snap = await coll.limit(100).get();
    }
    const list = [];
    snap.forEach(doc => {
      if (doc.id === uid) {
        return;
      }
      list.push(mapDocToUser(doc.id, doc.data()));
    });
    return {data: list};
  }

  const lower = q.toLowerCase();
  const upper = lower + '\uf8ff';
  const merge = new Map();
  let prefixError = false;

  try {
    const [byName, byEmail] = await Promise.all([
      coll
        .where('nameLower', '>=', lower)
        .where('nameLower', '<=', upper)
        .orderBy('nameLower')
        .limit(SEARCH_RESULT_LIMIT)
        .get(),
      coll
        .where('emailLower', '>=', lower)
        .where('emailLower', '<=', upper)
        .orderBy('emailLower')
        .limit(SEARCH_RESULT_LIMIT)
        .get(),
    ]);
    byName.forEach(doc => {
      if (doc.id !== uid) {
        merge.set(doc.id, mapDocToUser(doc.id, doc.data()));
      }
    });
    byEmail.forEach(doc => {
      if (doc.id !== uid) {
        merge.set(doc.id, mapDocToUser(doc.id, doc.data()));
      }
    });
  } catch (e) {
    prefixError = true;
    if (__DEV__) {
      console.warn('[getUserApi] Firestore prefix search failed', e);
    }
  }

  if (prefixError || merge.size === 0) {
    const legacySnap = await coll.limit(400).get();
    legacySnap.forEach(doc => {
      if (doc.id === uid) {
        return;
      }
      if (merge.size >= SEARCH_RESULT_LIMIT) {
        return;
      }
      const d = doc.data();
      const name = (d.name || '').toLowerCase();
      const email = (d.email || d.user_email || '').toLowerCase();
      if (name.includes(lower) || email.includes(lower)) {
        merge.set(doc.id, mapDocToUser(doc.id, d));
      }
    });
  }

  return {data: Array.from(merge.values()).slice(0, SEARCH_RESULT_LIMIT)};
}

function* getUserApiCall({data}) {
  try {
    const response = yield call(getUserApi, data);
    yield put(getUserSuccess(response.data));
  } catch (e) {
    const errMsg =
      e?.message || e?.code || (e?.response && e.response.data) || String(e);
    yield put(getUserFailure(errMsg));
  }
}

export default all([takeLatest(GET_USER, getUserApiCall)]);
