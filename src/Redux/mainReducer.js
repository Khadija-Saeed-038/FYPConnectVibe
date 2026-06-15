import {persistReducer} from 'redux-persist';

import AsyncStorage from '@react-native-async-storage/async-storage';

import login from '../Screens/LoginScreen/redux/reducer';
import signUp from '../Screens/RegisterScreen/redux/reducer';
import forgotPassword from '../Screens/ForgotPasswordScreen/redux/reducer';
import editProfile from '../Screens/EditProfileScreen/redux/reducer';
import themes from '../Screens/ThemeProvider/redux/reducer';
import searchUser from '../Screens/NewChat/redux/reducer';
import deviceAdd from '../Screens/HomeScreen/redux/reducer';
import notification from "../Screens/ChatScreen/redux/reducer";


const appPersistConfig = {
  key: 'login',
  whitelist: ['theme', 'login'],
  storage: AsyncStorage,
  timeout: null,
};

const persistedLoginReducer = persistReducer(appPersistConfig, login);
const persistedThemesReducer = persistReducer(appPersistConfig, themes);

export default {
  login: persistedLoginReducer,
  signUp,
  forgotPassword,
  editProfile,
  searchUser,
  deviceAdd,
  notification,
  themes: persistedThemesReducer,
};
