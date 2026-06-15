import {
  FORGOT_PASSWORD,
  FORGOT_PASSWORD_SUCCESS,
  FORGOT_PASSWORD_FAILURE,
  FORGOT_TOKEN,
  FORGOT_TOKEN_SUCCESS,
  FORGOT_TOKEN_FAILURE,
  SET_NEW_PASSWORD,
  SET_NEW_PASSWORD_SUCCESS,
  SET_NEW_PASSWORD_FAILURE,
} from "./types";

const initialState = {
  requesting: false,
  tokenRequesting: false,
  passwordRequesting: false,
  error: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case FORGOT_PASSWORD:
      return {
        ...state,
        requesting: true,
      };
    case FORGOT_PASSWORD_SUCCESS:
      return {
        ...state,
        requesting: false,
      };
    case FORGOT_PASSWORD_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };
    case FORGOT_TOKEN:
      return {
        ...state,
        tokenRequesting: true,
      };
    case FORGOT_TOKEN_SUCCESS:
      return {
        ...state,
        tokenRequesting: false,
      };
    case FORGOT_TOKEN_FAILURE:
      return {
        ...state,
        tokenRequesting: false,
        error: action.error,
      };
    case SET_NEW_PASSWORD:
      return {
        ...state,
        passwordRequesting: true,
      };
    case SET_NEW_PASSWORD_SUCCESS:
      return {
        ...state,
        passwordRequesting: false,
      };

    case SET_NEW_PASSWORD_FAILURE:
      return {
        ...state,
        passwordRequesting: false,
        error: action.error,
      };

    default:
      return state;
  }
}
