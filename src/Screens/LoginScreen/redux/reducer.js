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

const initialState = {
  requesting: false,
  disableRequesting: false,
  error: false,
  userDetail: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case LOGIN:
      return {
        ...state,
        requesting: true,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        requesting: false,
        userDetail: action.data,
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };
    case LOGOUT:
      return initialState;
    case FACEBOOK_LOGIN:
      return {
        ...state,
        requesting: true,
      };
    case FACEBOOK_LOGIN_SUCCESS:
      return {
        ...state,
        userDetail: action.data,
        requesting: false,
      };
    case FACEBOOK_LOGIN_FAILURE:
      return {
        ...state,
        error: action.error,
        requesting: false,
      };
    case GOOGLE_LOGIN:
      return {
        ...state,
        requesting: true,
      };
    case GOOGLE_LOGIN_SUCCESS:
      return {
        ...state,
        userDetail: action.data,
        requesting: false,
      };
    case GOOGLE_LOGIN_FAILURE:
      return {
        ...state,
        error: action.error,
        requesting: false,
      };
    case ACCOUNT_DISABLE:
      return {
        ...state,
        disableRequesting: true,
      };
    case ACCOUNT_DISABLE_SUCCESS:
      return initialState;
    case ACCOUNT_DISABLE_FAILURE:
      return {
        ...state,
        disableRequesting: false,
        error: action.error,
      };

    default:
      return state;
  }
}
