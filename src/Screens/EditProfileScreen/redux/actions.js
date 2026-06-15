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

export const getProfile = (data) => ({
  type: GET_PROFILE,
  data,
});
export const getProfileSuccess = (data) => ({
  type: GET_PROFILE_SUCCESS,
  data,
});
export const getProfileFailure = (error) => ({
  type: GET_PROFILE_FAILURE,
  error,
});

export const updateProfile = (data) => ({
  type: UPDATE_PROFILE,
  data,
});

export const updateProfileSuccess = (data) => ({
  type: UPDATE_PROFILE_SUCCESS,
  data,
});

export const updateProfileFailure = (error) => ({
  type: UPDATE_PROFILE_FAILURE,
  error,
});

export const updateProfileStatus = (data) => ({
  type: UPDATE_PROFILE_STATUS,
  data,
});

export const updateProfileStatusSuccess = (data) => ({
  type: UPDATE_PROFILE_STATUS_SUCCESS,
  data,
});

export const updateProfileStatusFailure = (error) => ({
  type: UPDATE_PROFILE_STATUS_FAILURE,
  error,
});
