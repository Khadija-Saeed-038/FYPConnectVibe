import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {Toast} from 'react-native-toast-notifications';
import {RTDB_MESSAGES_PATH} from '../Config/firebase';
import {fetchDmBlockStatus} from './blockStatus';
import {toChatProfile} from './toChatProfile';

/**
 * Ensures a 1:1 RTDM room exists and navigates to Chat (same contract as AddUser createAndNavigate).
 * @param {{ navigation: import('@react-navigation/native').NavigationProp<any>, userDetail: object, peer: object }} params
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function openDirectChat({navigation, userDetail, peer}) {
  const myId = userDetail?.id;
  const peerId = peer?.id;
  if (!myId || !peerId) {
    Toast.show('Missing user info');
    return {ok: false, error: 'MISSING'};
  }
  if (String(myId) === String(peerId)) {
    Toast.show('You cannot message yourself');
    return {ok: false, error: 'SELF'};
  }

  const blockStatus = await fetchDmBlockStatus(myId, peerId);
  if (blockStatus.blocked) {
    Toast.show(
      blockStatus.iBlockedThem
        ? 'You blocked this user'
        : "You can't message this user",
    );
    return {ok: false, error: 'BLOCKED'};
  }

  const a = String(myId);
  const b = String(peerId);
  const roomId = [a, b].sort().join('_');
  const roomRef = database().ref(`${RTDB_MESSAGES_PATH}/${roomId}`);

  try {
    const fbUser = auth().currentUser;
    if (!fbUser) {
      Toast.show(
        'Sign in with Firebase first to start a chat.',
        Toast.LONG,
      );
      return {ok: false, error: 'AUTH'};
    }
    try {
      await fbUser.getIdToken(true);
    } catch (_) {
      /* best-effort */
    }

    const snapshot = await roomRef.once('value');
    const existing = snapshot.val() || {};
    const memberIds = {[a]: true, [b]: true};
    const messages = Array.isArray(existing.messages) ? existing.messages : [];
    const value = {
      memberIds,
      sender: toChatProfile(userDetail),
      senderId: myId,
      receiverId: peerId,
      receiver: toChatProfile(peer),
      id: roomId,
      timeStamp: Date.now(),
      receiverRead: existing.receiverRead ?? 0,
      senderRead: existing.senderRead ?? 0,
      readAt: existing.readAt ?? {},
      messages,
      type: null,
      name: null,
      participentIds: null,
      participents: null,
    };
    await roomRef.update(value);
    const dataForNav = Object.fromEntries(
      Object.entries(value).filter(([, v]) => v != null),
    );
    navigation.navigate('Chat', {
      messageuid: roomId,
      data: dataForNav,
    });
    return {ok: true};
  } catch (e) {
    const code = e?.code || '';
    const isDenied =
      code === 'database/permission-denied' ||
      String(e?.message || '').includes('permission-denied');
    if (__DEV__) {
      console.error('openDirectChat RTDB failed', e);
    }
    Toast.show(
      isDenied
        ? 'Could not save chat. Sign in, then publish Realtime Database rules for Messages (see database.rules.json and FIREBASE_SETUP_STEP_BY_STEP.md).'
        : 'Something went wrong!',
      Toast.LONG,
    );
    return {ok: false, error: String(e?.message || code)};
  }
}
