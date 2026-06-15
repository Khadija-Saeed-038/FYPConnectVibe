import {call, put, all, takeLatest} from 'redux-saga/effects';

import {ADD_DEVICE} from './types';

import {addDeviceSuccess, addDeviceFailure} from './actions';
import {FIRESTORE_USERS_COLLECTION} from '../../../Config/firebase';

async function addDeviceAPi(data) {
  const auth = require('@react-native-firebase/auth').default;
  const firestore = require('@react-native-firebase/firestore').default;
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new Error('Not signed in');
  }
  const token = data.registration_id || data.token;
  if (!token) {
    return {};
  }
  await firestore()
    .collection(FIRESTORE_USERS_COLLECTION)
    .doc(uid)
    .update({
      devices: firestore.FieldValue.arrayUnion(String(token)),
      lastFcmToken: String(token),
      lastFcmPlatform: data.type || 'unknown',
    });
  return {};
}

function* addDeviceApiCall({data}) {
  try {
    yield call(addDeviceAPi, data);
    yield put(addDeviceSuccess());
  } catch (e) {
    const {response} = e;
    yield put(addDeviceFailure(response));
  }
}

export default all([takeLatest(ADD_DEVICE, addDeviceApiCall)]);
