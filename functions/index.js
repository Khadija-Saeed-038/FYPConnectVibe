const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

function asString(value) {
  return value == null ? '' : String(value);
}

function resolveRecipients(room, senderId) {
  const sender = asString(senderId);
  const recipients = new Set();

  if (room?.type === 'group') {
    const memberIds = room.memberIds;
    if (memberIds && typeof memberIds === 'object') {
      Object.keys(memberIds).forEach(uid => {
        if (asString(uid) !== sender) {
          recipients.add(asString(uid));
        }
      });
    }
    const participentIds = room.participentIds;
    if (Array.isArray(participentIds)) {
      participentIds.forEach(uid => {
        if (asString(uid) !== sender) {
          recipients.add(asString(uid));
        }
      });
    }
    return [...recipients];
  }

  const receiverId = asString(room?.receiverId);
  const roomSenderId = asString(room?.senderId);
  if (receiverId && receiverId !== sender) {
    recipients.add(receiverId);
  }
  if (roomSenderId && roomSenderId !== sender) {
    recipients.add(roomSenderId);
  }
  return [...recipients];
}

function messagePreview(message) {
  if (!message) {
    return 'New message';
  }
  if (message.type === 'image') {
    return 'Sent a photo';
  }
  const text = asString(message.text).trim();
  return text || 'New message';
}

function resolveTitle(room, senderId) {
  const sender = asString(senderId);
  if (room?.type === 'group') {
    return asString(room?.name) || 'Group chat';
  }
  if (asString(room?.senderId) === sender && room?.sender?.name) {
    return room.sender.name;
  }
  if (asString(room?.receiverId) === sender && room?.receiver?.name) {
    return room.receiver.name;
  }
  if (asString(room?.senderId) !== sender && room?.sender?.name) {
    return room.sender.name;
  }
  if (asString(room?.receiverId) !== sender && room?.receiver?.name) {
    return room.receiver.name;
  }
  return 'New message';
}

async function loadDeviceTokens(userIds) {
  const tokens = new Set();
  await Promise.all(
    userIds.map(async uid => {
      if (!uid) {
        return;
      }
      const snap = await db.collection('users').doc(uid).get();
      if (!snap.exists) {
        return;
      }
      const data = snap.data() || {};
      const devices = Array.isArray(data.devices) ? data.devices : [];
      devices.forEach(token => {
        if (token) {
          tokens.add(String(token));
        }
      });
      if (data.lastFcmToken) {
        tokens.add(String(data.lastFcmToken));
      }
    }),
  );
  return [...tokens];
}

async function sendPushToTokens(tokens, payload) {
  if (!tokens.length) {
    return;
  }
  const chunkSize = 500;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'com.connectvibe',
        },
      },
    });
  }
}

exports.onNewChatMessage = functions.database
  .ref('/Messages/{roomId}')
  .onWrite(async (change, context) => {
    const after = change.after.val();
    if (!after) {
      return null;
    }

    const before = change.before.val() || {};
    const beforeMessages = Array.isArray(before.messages) ? before.messages : [];
    const afterMessages = Array.isArray(after.messages) ? after.messages : [];

    if (afterMessages.length <= beforeMessages.length) {
      return null;
    }

    const newMessage = afterMessages[afterMessages.length - 1];
    const senderId = asString(newMessage?.senderId || after.senderId);
    if (!senderId) {
      return null;
    }

    const recipients = resolveRecipients(after, senderId);
    if (!recipients.length) {
      return null;
    }

    const tokens = await loadDeviceTokens(recipients);
    if (!tokens.length) {
      return null;
    }

    const roomId = context.params.roomId;
    const title = resolveTitle(after, senderId);
    const body = messagePreview(newMessage);

    await sendPushToTokens(tokens, {
      title,
      body,
      data: {
        roomId: asString(roomId),
        type: asString(after.type || 'dm'),
        title,
        body,
      },
    });

    return null;
  });

exports.onUserProfileUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const userId = context.params.userId;

    const nameChanged = asString(before.name) !== asString(after.name);
    const imageChanged =
      asString(before.profile_image) !== asString(after.profile_image);
    if (!nameChanged && !imageChanged) {
      return null;
    }

    const messagesSnap = await admin.database().ref('Messages').once('value');
    const allRooms = messagesSnap.val() || {};
    const peerIds = new Set();

    Object.values(allRooms).forEach(room => {
      if (!room || room.type === 'group') {
        return;
      }
      const senderId = asString(room.senderId);
      const receiverId = asString(room.receiverId);
      if (senderId === userId && receiverId) {
        peerIds.add(receiverId);
      } else if (receiverId === userId && senderId) {
        peerIds.add(senderId);
      }
    });

    if (!peerIds.size) {
      return null;
    }

    const tokens = await loadDeviceTokens([...peerIds]);
    if (!tokens.length) {
      return null;
    }

    const displayName = asString(after.name) || 'A contact';
    await sendPushToTokens(tokens, {
      title: 'Profile updated',
      body: `${displayName} updated their profile`,
      data: {
        type: 'profile_update',
        userId: asString(userId),
        title: 'Profile updated',
        body: `${displayName} updated their profile`,
      },
    });

    return null;
  });
