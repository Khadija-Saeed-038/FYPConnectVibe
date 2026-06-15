import {ADD_DEVICE, ADD_DEVICE_SUCCESS, ADD_DEVICE_FAILURE} from './types';

const initialState = {
  deviceRequesting: false,
  service: false,
  error: false,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case ADD_DEVICE:
      return {
        ...state,
        deviceRequesting: true,
      };
    case ADD_DEVICE_SUCCESS: {
      return {
        ...state,
        deviceRequesting: false,
      };
    }
    case ADD_DEVICE_FAILURE:
      return {
        ...state,
        deviceRequesting: false,
      };
    default:
      return state;
  }
}
