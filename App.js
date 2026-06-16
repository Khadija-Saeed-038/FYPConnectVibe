import React, {useEffect, useState} from 'react';
import RootNavigator from './src/Navigation';
import {ToastProvider} from 'react-native-toast-notifications';
import {Provider} from 'react-redux';
import store from './src/Redux/store';
import AnimatedSplash from 'react-native-animated-splash-screen';
import SplashScreen from './src/Screens/SplashScreen';
import {Dimensions, Platform, StatusBar} from 'react-native';
import {persistStore} from 'redux-persist';
import {PersistGate} from 'redux-persist/integration/react';

import {ThemeProvider} from './src/Screens/ThemeProvider/ThemeProvider';
import messaging from '@react-native-firebase/messaging';
import {bootstrapEnergyMatchSession} from './src/Utils/energyMatchSession';
import {attachAuthNotificationBootstrap} from './src/Utils/notification';
import {
  configurePushNotifications,
  showLocalPushNotification,
} from './src/Utils/pushDisplay';

const persist = persistStore(store);
const toastOffsetTop =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

export default function App() {
  const [loading, setLoading] = useState(false);
  const {height, width} = Dimensions.get('window');
  const logoHeight = height;
  const logoWidth = width;

  useEffect(() => {
    configurePushNotifications();

    const unsubscribeAuth = attachAuthNotificationBootstrap();

    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
      showLocalPushNotification(remoteMessage);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMessage();
    };
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
    <ToastProvider placement="top" offsetTop={toastOffsetTop}>
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
