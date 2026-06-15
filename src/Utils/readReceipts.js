import database from '@react-native-firebase/database';
import {RTDB_MESSAGES_PATH} from '../Config/firebase';
import {isGroupMember} from './groupMembers';

function readAtMap(room) {
  const raw = room?.readAt;
  return raw && typeof raw === 'object' ? raw : {};
}

function memberIdList(room) {
  const set = new Set();
  if (room?.memberIds && typeof room.memberIds === 'object') {
    Object.keys(room.memberIds).forEach(k => {
      if (room.memberIds[k] === true) {
        set.add(String(k));
      }
    });
  }
  const ids = Array.isArray(room?.participentIds) ? room.participentIds : [];
  ids.forEach(x => {
    if (x != null) {
      set.add(String(x));
    }
  });
  return [...set];
}

export function getDmPeerId(room, myId) {
  const me = myId != null ? String(myId) : '';
  if (!room || !me) {
    return '';
  }
  const sid = room.senderId != null ? String(room.senderId) : '';
  const rid = room.receiverId != null ? String(room.receiverId) : '';
  if (sid === me) {
    return rid;
  }
  if (rid === me) {
    return sid;
  }
  return '';
}

/**
 * Patch to clear unread counter for the user opening the chat.
 */
export function clearUnreadForUser(room, userId) {
  const me = userId != null ? String(userId) : '';
  if (!room || !me) {
    return {};
  }
  const sid = room.senderId != null ? String(room.senderId) : '';
  const rid = room.receiverId != null ? String(room.receiverId) : '';
  if (me === rid) {
    return {receiverRead: 0};
  }
  if (me === sid) {
    return {senderRead: 0};
  }
  return {};
}

/**
 * Increment only the peer's unread counter when sending a message.
 */
export function incrementPeerUnread(room, senderUserId) {
  const me = senderUserId != null ? String(senderUserId) : '';
  if (!room || !me) {
    return {};
  }
  const sid = room.senderId != null ? String(room.senderId) : '';
  const rid = room.receiverId != null ? String(room.receiverId) : '';
  if (me === sid && rid) {
    const cur = Number(room.receiverRead) || 0;
    return {receiverRead: cur + 1};
  }
  if (me === rid && sid) {
    const cur = Number(room.senderRead) || 0;
    return {senderRead: cur + 1};
  }
  return {};
}

export async function markChatAsRead(roomId, userId) {
  const rid = String(roomId || '').trim();
  const uid = userId != null ? String(userId) : '';
  if (!rid || !uid) {
    return;
  }
  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val() || {};
  const now = Date.now();
  await ref.update({
    [`readAt/${uid}`]: now,
    ...clearUnreadForUser(room, uid),
  });
}

/**
 * @returns {'read' | 'sent'}
 */
export function getDmReadStatus(message, room, myId) {
  if (!message || !room) {
    return 'sent';
  }
  const peerId = getDmPeerId(room, myId);
  if (!peerId) {
    return 'sent';
  }
  const peerReadAt = Number(readAtMap(room)[peerId]) || 0;
  const msgTime = Number(message.timeStamp) || 0;
  if (peerReadAt >= msgTime && msgTime > 0) {
    return 'read';
  }
  return 'sent';
}

/**
 * @returns {'read' | 'sent'}
 */
export function getGroupReadStatus(message, room, myId) {
  if (!message || !room) {
    return 'sent';
  }
  const me = myId != null ? String(myId) : '';
  const msgTime = Number(message.timeStamp) || 0;
  if (!me || msgTime <= 0) {
    return 'sent';
  }
  const members = memberIdList(room).filter(id => id !== me);
  if (members.length === 0) {
    return 'sent';
  }
  const reads = readAtMap(room);
  const allRead = members.every(id => (Number(reads[id]) || 0) >= msgTime);
  return allRead ? 'read' : 'sent';
}

export function canMarkGroupRead(room, myId) {
  return isGroupMember(room, myId);
}
