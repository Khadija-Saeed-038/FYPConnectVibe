import {
  GET_PROFILE,
  GET_PROFILE_SUCCESS,
  GET_PROFILE_FAILURE,
  UPDATE_PROFILE,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_FAILURE,
  UPDATE_PROFILE_STATUS,
  UPDATE_PROFILE_STATUS_SUCCESS,
  UPDATE_PROFILE_STATUS_FAILURE,
} from "./types";

const initialState = {
  requesting: false,
  getProfileRequesting: false,
  profile: false,
  error: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case GET_PROFILE:
      return {
        ...state,
        getProfileRequesting: true,
      };

    case GET_PROFILE_SUCCESS:
      return {
        ...state,
        getProfileRequesting: false,
        profile: action.data,
      };
    case GET_PROFILE_FAILURE:
      return {
        ...state,
        getProfileRequesting: false,
        error: action.error,
      };

    case UPDATE_PROFILE:
      return {
        ...state,
        requesting: true,
      };
    case UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        requesting: false,
        profile: action.data,
      };
    case UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };

    case UPDATE_PROFILE_STATUS:
      return {
        ...state,
        requesting: true,
      };
    case UPDATE_PROFILE_STATUS_SUCCESS:
      return {
        ...state,
        requesting: false,
        profile: action.data,
      };
    case UPDATE_PROFILE_STATUS_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };
    default:
      return state;
  }
}
