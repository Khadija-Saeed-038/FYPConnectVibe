import {all} from 'redux-saga/effects';

import login from '../Screens/LoginScreen/redux/saga';
import signUp from '../Screens/RegisterScreen/redux/saga';
import forgotPassword from '../Screens/ForgotPasswordScreen/redux/saga';
import editProfile from '../Screens/EditProfileScreen/redux/saga';
import searchUser from '../Screens/NewChat/redux/saga';
import deviceAdd from '../Screens/HomeScreen/redux/saga';
import notification from "../Screens/ChatScreen/redux/saga";


export function* mainSaga() {
  yield all({
    login,
    signUp,
    forgotPassword,
    editProfile,
    searchUser,
    deviceAdd,
    notification
  });
}
