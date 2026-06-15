import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import navigationService from '../Navigation/NavigationService';

/** Must match LoginScreen and any API that reads the device token. */
const FCM_STORAGE_KEY = 'FCMToken';

let tokenRefreshUnsubscribe = null;
let notificationListenersAttached = false;

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

const GetFCMToken = async doTask => {
  try {
    const authorized = await requestUserPermission();
    if (!authorized) {
      return;
    }

    let existing = await AsyncStorage.getItem(FCM_STORAGE_KEY);
    if (!existing) {
      const legacy = await AsyncStorage.getItem('fcmtoken');
      if (legacy) {
        await AsyncStorage.setItem(FCM_STORAGE_KEY, legacy);
        await AsyncStorage.removeItem('fcmtoken');
        existing = legacy;
      }
    }

    if (!existing) {
      try {
        const token = await messaging().getToken();
        if (token) {
          await AsyncStorage.setItem(FCM_STORAGE_KEY, token);
          if (__DEV__) {
            console.info('[FCM] token stored', {
              registration_id: token,
              type: Platform.OS,
            });
          }
        }
      } catch (error) {
        console.error('[FCM] getToken error', error);
      }
    }

    NotificationListner(doTask);

    if (!tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe = messaging().onTokenRefresh(async token => {
        await AsyncStorage.setItem(FCM_STORAGE_KEY, token);
      });
    }
  } catch (e) {
    console.error('[FCM] GetFCMToken error', e);
  }
};

const NotificationListner = doTask => {
  if (notificationListenersAttached) {
    return;
  }
  notificationListenersAttached = true;

  messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage?.data && remoteMessage?.notification?.title) {
      setTimeout(() => {
        navigationService.navigate('Chat');
      }, 500);
    }
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage?.data && remoteMessage?.notification?.title) {
        setTimeout(() => {
          navigationService.navigate('Chat');
        }, 500);
      }
    });
};

export {requestUserPermission, GetFCMToken, NotificationListner};
