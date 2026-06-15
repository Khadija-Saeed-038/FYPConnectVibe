import {SIGNUP, SIGNUP_SUCCESS, SIGNUP_FAILURE} from './types';

const initialState = {
  requesting: false,
  signup_detail: false,
  error: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case SIGNUP:
      return {
        ...state,
        requesting: true,
      };
    case SIGNUP_SUCCESS:
      return {
        ...state,
        requesting: false,
        signup_detail: action.data,
      };
    case SIGNUP_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };
    default:
      return state;
  }
}
