import {
  GET_NOTIFICATION,
  GET_NOTIFICATION_SUCCESS,
  GET_NOTIFICATION_FAILURE,
  ADD_NOTIFICATION,
  ADD_NOTIFICATION_SUCCESS,
  ADD_NOTIFICATION_FAILURE,
} from "./types";

export const getNotification = () => ({
  type: GET_NOTIFICATION,
});

export const getNotificationSuccess = (data) => ({
  type: GET_NOTIFICATION_SUCCESS,
  data,
});
export const getNotificationFailure = (error) => ({
  type: GET_NOTIFICATION_FAILURE,
  error,
});

export const addNotification = (data) => ({
  type: ADD_NOTIFICATION,
  data,
});

export const addNotificationSuccess = (data) => ({
  type: ADD_NOTIFICATION_SUCCESS,
  data,
});

export const addNotificationFailure = (error) => ({
  type: ADD_NOTIFICATION_FAILURE,
  error,
});
