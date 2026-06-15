import {call, put, all, takeLatest} from 'redux-saga/effects';

import {GET_NOTIFICATION, ADD_NOTIFICATION} from './types';
import {
  getNotificationSuccess,
  getNotificationFailure,
  addNotificationSuccess,
  addNotificationFailure,
} from './actions';

async function getNotificationAPi() {
  // Notifications can be stored in Firestore later; keep local empty list for now.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: []
      });
    }, 300);
  });
}

async function addNotificationAPi(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          id: Date.now(),
          message: 'Notification sent',
          ...data
        }
      });
    }, 300);
  });
}

function* getNotificationApiCall({}) {
  try {
    const response = yield call(getNotificationAPi);
    yield put(getNotificationSuccess(response.data));
  } catch (e) {
    const {response} = e;
    yield put(getNotificationFailure(response));
  }
}

function* addNotificationApiCall({data}) {
  try {
    const response = yield call(addNotificationAPi, data);
    yield put(addNotificationSuccess(response.data));
  } catch (e) {
    const {response} = e;
    yield put(addNotificationFailure(response));
  }
}

export default all([
  takeLatest(GET_NOTIFICATION, getNotificationApiCall),
  takeLatest(ADD_NOTIFICATION, addNotificationApiCall),
]);
