import {
  LOGIN,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  FACEBOOK_LOGIN,
  FACEBOOK_LOGIN_SUCCESS,
  FACEBOOK_LOGIN_FAILURE,
  GOOGLE_LOGIN,
  GOOGLE_LOGIN_SUCCESS,
  GOOGLE_LOGIN_FAILURE,
  ACCOUNT_DISABLE,
  ACCOUNT_DISABLE_SUCCESS,
  ACCOUNT_DISABLE_FAILURE,
} from "./types";

export const login = (data, fcmToken) => ({
  type: LOGIN,
  data,
  fcmToken,
});

export const loginSuccess = (data) => ({
  type: LOGIN_SUCCESS,
  data,
});

export const loginFailure = (error) => ({
  type: LOGIN_FAILURE,
  error,
});

export const logout = () => ({
  type: LOGOUT,
});

export const facebookLogin = (data) => ({
  type: FACEBOOK_LOGIN,
  data,
});

export const facebookLoginSuccess = (data) => ({
  type: FACEBOOK_LOGIN_SUCCESS,
  data,
});

export const facebookLoginFailure = (error) => ({
  type: FACEBOOK_LOGIN_FAILURE,
  error,
});

export const googleLogin = (data) => ({
  type: GOOGLE_LOGIN,
  data,
});

export const googleLoginSuccess = (data, hideModal) => ({
  type: GOOGLE_LOGIN_SUCCESS,
  data,
  hideModal,
});

export const googleLoginFailure = (error) => ({
  type: GOOGLE_LOGIN_FAILURE,
  error,
});

export const accountDisable = (data, hideModal) => {
  return {
    type: ACCOUNT_DISABLE,
    data,
    hideModal,
  };
};

export const accountDisableSuccess = (data) => ({
  type: ACCOUNT_DISABLE_SUCCESS,
  data,
});

export const accountDisableFailure = (error) => ({
  type: ACCOUNT_DISABLE_FAILURE,
  error,
});
