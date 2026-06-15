import combinedReducers from './mainReducer';
import createSagaMiddleware from 'redux-saga';
import {createStore, applyMiddleware, compose} from 'redux';
import {persistCombineReducers} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {mainSaga} from './mainSaga';
const sagaMiddleware = createSagaMiddleware();
/**
 * this app uses React Native Debugger, but it works without it
 * Never reference `window` unguarded — release Hermes can throw ReferenceError at import time.
 */
function getReduxDevToolsCompose() {
  const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
  if (g && typeof g.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function') {
    return g.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
  }
  if (typeof window !== 'undefined' && typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function') {
    return window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
  }
  return null;
}
const composeEnhancers = getReduxDevToolsCompose() || compose;
const middlewares = [sagaMiddleware /** more middlewares if any goes here */];
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['login'],
};
const persistedReducer = persistCombineReducers(
  persistConfig,
  combinedReducers,
);
const store = createStore(
  persistedReducer,
  composeEnhancers(applyMiddleware(...middlewares)),
);
sagaMiddleware.run(mainSaga);
export default store;
