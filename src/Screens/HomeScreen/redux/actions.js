import {ADD_DEVICE, ADD_DEVICE_SUCCESS, ADD_DEVICE_FAILURE} from './types';

export const addDevice = data => ({
  type: ADD_DEVICE,
  data,
});

export const addDeviceSuccess = data => ({
  type: ADD_DEVICE_SUCCESS,
  data,
});

export const addDeviceFailure = error => ({
  type: ADD_DEVICE_FAILURE,
  error,
});
