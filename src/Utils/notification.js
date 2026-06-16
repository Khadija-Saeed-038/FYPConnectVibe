import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import navigationService from '../Navigation/NavigationService';
import {syncFcmTokenToFirestore} from './fcmTokenSync';

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

async function persistAndSyncToken(token) {
  if (!token) {
    return;
  }
  await AsyncStorage.setItem(FCM_STORAGE_KEY, token);
  try {
    await syncFcmTokenToFirestore(token, Platform.OS);
    if (__DEV__) {
      console.info('[FCM] token synced', {type: Platform.OS});
    }
  } catch (error) {
    console.error('[FCM] sync token error', error);
  }
}

const GetFCMToken = async () => {
  try {
    const authorized = await requestUserPermission();
    if (!authorized) {
      return null;
    }

    let token = await AsyncStorage.getItem(FCM_STORAGE_KEY);
    if (!token) {
      const legacy = await AsyncStorage.getItem('fcmtoken');
      if (legacy) {
        await AsyncStorage.setItem(FCM_STORAGE_KEY, legacy);
        await AsyncStorage.removeItem('fcmtoken');
        token = legacy;
      }
    }

    if (!token) {
      try {
        token = await messaging().getToken();
      } catch (error) {
        console.error('[FCM] getToken error', error);
      }
    }

    if (token) {
      await persistAndSyncToken(token);
    }

    NotificationListner();

    if (!tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe = messaging().onTokenRefresh(async refreshed => {
        await persistAndSyncToken(refreshed);
      });
    }

    return token;
  } catch (e) {
    console.error('[FCM] GetFCMToken error', e);
    return null;
  }
};

const NotificationListner = () => {
  if (notificationListenersAttached) {
    return;
  }
  notificationListenersAttached = true;

  const openFromPush = remoteMessage => {
    const data = remoteMessage?.data || {};
    const roomId = data.roomId;
    if (roomId) {
      setTimeout(() => {
        const route = data.type === 'group' ? 'GroupChat' : 'Chat';
        navigationService.navigate(route, {messageuid: roomId});
      }, 500);
      return;
    }
    if (remoteMessage?.notification?.title || data.title) {
      setTimeout(() => {
        navigationService.navigate('BottomBar');
      }, 500);
    }
  };

  messaging().onNotificationOpenedApp(openFromPush);

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        openFromPush(remoteMessage);
      }
    });
};

async function bootstrapNotificationServices() {
  const user = auth().currentUser;
  if (!user) {
    return;
  }
  await GetFCMToken();
}

function attachAuthNotificationBootstrap() {
  return auth().onAuthStateChanged(user => {
    if (user) {
      bootstrapNotificationServices();
    }
  });
}

export {
  requestUserPermission,
  GetFCMToken,
  NotificationListner,
  bootstrapNotificationServices,
  attachAuthNotificationBootstrap,
  persistAndSyncToken,
};
