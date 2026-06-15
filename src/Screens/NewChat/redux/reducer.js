import {GET_USER, GET_USER_SUCCESS, GET_USER_FAILURE} from './types';

const initialState = {
  requesting: false,
  profile: [],
  error: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case GET_USER:
      return {
        ...state,
        requesting: true,
      };

    case GET_USER_SUCCESS:
      return {
        ...state,
        requesting: false,
        profile: action.data,
      };
    case GET_USER_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };
    default:
      return state;
  }
}
