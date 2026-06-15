import {
  GET_NOTIFICATION,
  GET_NOTIFICATION_SUCCESS,
  GET_NOTIFICATION_FAILURE,
  ADD_NOTIFICATION,
  ADD_NOTIFICATION_SUCCESS,
  ADD_NOTIFICATION_FAILURE,
} from "./types";
const initialState = {
  requesting: false,
  addRequesting: false,
  notification: false,
  error: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case GET_NOTIFICATION:
      return {
        ...state,
        requesting: true,
      };
    case GET_NOTIFICATION_SUCCESS:
      return {
        ...state,
        requesting: false,
        notification: action.data,
      };
    case GET_NOTIFICATION_FAILURE:
      return {
        ...state,
        requesting: false,
        error: action.error,
      };
    case ADD_NOTIFICATION:
      return {
        ...state,
        addRequesting: true,
      };
    case ADD_NOTIFICATION_SUCCESS:
      return {
        ...state,
        addRequesting: false,
      };
    case ADD_NOTIFICATION_FAILURE:
      return {
        ...state,
        addRequesting: false,
        error: action.error,
      };

    default:
      return state;
  }
}
