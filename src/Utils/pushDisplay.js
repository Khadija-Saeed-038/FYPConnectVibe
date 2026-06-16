import {Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';

export const PUSH_CHANNEL_ID = 'com.connectvibe';

export function configurePushNotifications() {
  PushNotification.configure({
    requestPermissions: Platform.OS === 'ios',
    onNotification: () => {},
  });

  if (Platform.OS === 'android') {
    PushNotification.createChannel({
      channelId: PUSH_CHANNEL_ID,
      channelName: 'ConnectVibe',
      importance: 4,
      vibrate: true,
    });
  }
}

export function extractNotificationContent(remoteMessage) {
  const title =
    remoteMessage?.notification?.title || remoteMessage?.data?.title || '';
  const body =
    remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
  return {title: String(title), body: String(body)};
}

export function showLocalPushNotification(remoteMessage) {
  const {title, body} = extractNotificationContent(remoteMessage);
  if (!title) {
    return false;
  }

  const payload = {
    id: String(remoteMessage?.messageId ?? Date.now()),
    title,
    message: body,
    userInfo: remoteMessage?.data || {},
  };

  if (Platform.OS === 'android') {
    PushNotification.localNotification({
      ...payload,
      channelId: PUSH_CHANNEL_ID,
    });
  } else {
    PushNotification.localNotification(payload);
  }

  return true;
}
