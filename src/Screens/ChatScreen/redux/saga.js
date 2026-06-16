import {call, put, all, takeLatest} from 'redux-saga/effects';

import {GET_NOTIFICATION, ADD_NOTIFICATION} from './types';
import {
  getNotificationSuccess,
  getNotificationFailure,
  addNotificationSuccess,
  addNotificationFailure,
} from './actions';

async function getNotificationAPi() {
  return {data: []};
}

async function addNotificationAPi() {
  // Push delivery is handled by Firebase Cloud Functions; no client-side send.
  return {data: {ok: true}};
}

function* getNotificationApiCall() {
  try {
    const response = yield call(getNotificationAPi);
    yield put(getNotificationSuccess(response.data));
  } catch (e) {
    const {response} = e;
    yield put(getNotificationFailure(response));
  }
}

function* addNotificationApiCall() {
  try {
    const response = yield call(addNotificationAPi);
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
