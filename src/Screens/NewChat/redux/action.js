import {GET_USER, GET_USER_SUCCESS, GET_USER_FAILURE} from './types';

export const getUser = data => ({
  type: GET_USER,
  data,
});
export const getUserSuccess = data => ({
  type: GET_USER_SUCCESS,
  data,
});
export const getUserFailure = error => ({
  type: GET_USER_FAILURE,
  error,
});
