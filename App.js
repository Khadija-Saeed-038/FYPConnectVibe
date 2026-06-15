import React, {useEffect, useState} from 'react';
import RootNavigator from './src/Navigation';
import {ToastProvider} from 'react-native-toast-notifications';
import {Provider} from 'react-redux';
import store from './src/Redux/store';
import AnimatedSplash from 'react-native-animated-splash-screen';
import SplashScreen from './src/Screens/SplashScreen';
import {Dimensions, Platform} from 'react-native';
import {persistStore} from 'redux-persist';
import {PersistGate} from 'redux-persist/integration/react';

import {ThemeProvider} from './src/Screens/ThemeProvider/ThemeProvider';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import {bootstrapEnergyMatchSession} from './src/Utils/energyMatchSession';


const persist = persistStore(store);

export default function App() {
  const [loading, setLoading] = useState(false);
  const {height, width} = Dimensions.get('window');
  const logoHeight = height;
  const logoWidth = width;

  useEffect(() => {
    PushNotification.createChannel({
      channelId: 'com.connectvibe',
      channelName: 'com.connectvibe',
    });

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage?.notification?.title;
      const body = remoteMessage?.notification?.body ?? '';
      if (!title) {
        return;
      }
      let localNotification = {
        id: String(remoteMessage?.messageId ?? Date.now()),
        title,
        message: body,
      };
      if (Platform.OS === 'android') {
        localNotification = {
          ...localNotification,
          channelId: 'com.connectvibe',
        };
      }
      PushNotification.localNotification(localNotification);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await bootstrapEnergyMatchSession();
      if (!cancelled && __DEV__ && !result?.ok) {
        console.warn('[EnergyMatch] bootstrap session:', result?.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onloading = () => {
    setTimeout(() => {
      setLoading(true);
    }, 2000);
  };
  useEffect(() => {
    onloading();
  }, []);

  return (
    <ToastProvider>
      <ThemeProvider>
        <AnimatedSplash
          isLoaded={loading}
          customComponent={<SplashScreen />}
          logoWidth={logoWidth}
          logoHeight={logoHeight}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persist}>
              <RootNavigator />
            </PersistGate>
          </Provider>
        </AnimatedSplash>
      </ThemeProvider>
    </ToastProvider>
  );
}
