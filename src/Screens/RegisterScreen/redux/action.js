import {SIGNUP, SIGNUP_SUCCESS, SIGNUP_FAILURE} from './types';
export const signup = (data, callBack) => ({
  type: SIGNUP,
  data,
  callBack,
});

export const signupSuccess = data => ({
  type: SIGNUP_SUCCESS,
  data,
});

export const signupFailure = error => ({
  type: SIGNUP_FAILURE,
  error,
});
