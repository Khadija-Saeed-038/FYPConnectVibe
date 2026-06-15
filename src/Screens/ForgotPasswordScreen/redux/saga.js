import {call, put, all, takeLatest} from 'redux-saga/effects';
import {FORGOT_PASSWORD, FORGOT_TOKEN, SET_NEW_PASSWORD} from './types';
import {
  forgotPasswordSuccess,
  forgotPasswordFailure,
  forgotTokenSuccess,
  forgotTokenFailure,
  setNewPasswordFailure,
} from './actions';
import {Toast} from 'react-native-toast-notifications';

async function ForgetPasswordApi(data) {
  const auth = require('@react-native-firebase/auth').default;
  await auth().sendPasswordResetEmail(data.email);
  return {data: {message: 'Password reset email sent'}};
}

/** Firebase completes reset via email link; no in-app token step. */
async function ForgetTokenApi() {
  return {data: {message: 'Use the link in your email', valid: true}};
}

/** Password is set through the Firebase email link, not in-app. */
async function setNewPasswordApi() {
  return {data: {message: 'Use the link in your email to set a new password'}};
}

function* ForgotPassword({data, callBack}) {
  try {
    const response = yield call(ForgetPasswordApi, data);
    const resData = response?.data ?? response;
    yield put(forgotPasswordSuccess(resData));
    Toast.show('Check your email for a reset link');
    callBack();
  } catch (e) {
    const {response} = e;
    yield put(forgotPasswordFailure(response));
    let message = 'Something went wrong, please try again later';
    if (e?.message?.includes('auth/user-not-found')) {
      message = 'No account found for this email';
    } else if (response && response.data && response.data.email) {
      message = response?.data?.email;
    }
    Toast.show(message);
  }
}

function* ForgotToken({data, callBack}) {
  try {
    const response = yield call(ForgetTokenApi, data);
    yield put(forgotTokenSuccess(response.data));
    callBack();
  } catch (e) {
    const {response} = e;
    yield put(forgotTokenFailure(response));
    if (response?.data?.detail) {
      Toast.show('Invalid code');
    }
  }
}

function* SetNEwPassword({data, callBack}) {
  try {
    yield call(setNewPasswordApi, data);
    Toast.show('Use the link in your email to set a new password');
    callBack();
  } catch (e) {
    const {response} = e;
    yield put(setNewPasswordFailure(response));
    if (response?.data?.password) {
      Toast.show(response?.data?.password);
    } else {
      Toast.show('Something went wrong');
    }
  }
}

export default all([
  takeLatest(FORGOT_PASSWORD, ForgotPassword),
  takeLatest(FORGOT_TOKEN, ForgotToken),
  takeLatest(SET_NEW_PASSWORD, SetNEwPassword),
]);
