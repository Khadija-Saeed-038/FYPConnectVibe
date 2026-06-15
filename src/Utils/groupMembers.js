import database from '@react-native-firebase/database';
import {RTDB_MESSAGES_PATH} from '../Config/firebase';
import {fetchUserDoc} from './blockedUsersList';

export function getGroupAdminId(room) {
  if (!room || typeof room !== 'object') {
    return '';
  }
  const admin = room.adminId != null ? String(room.adminId) : '';
  if (admin) {
    return admin;
  }
  return room.senderId != null ? String(room.senderId) : '';
}

export function isGroupAdmin(room, myId) {
  const adminId = getGroupAdminId(room);
  const me = myId != null ? String(myId) : '';
  return Boolean(adminId && me && adminId === me);
}

/**
 * True if user is still an active group member.
 * Prefers memberIds when present (matches RTDB rules).
 */
export function isGroupMember(room, myId) {
  if (!room || myId == null) {
    return false;
  }
  const id = String(myId);
  if (room.memberIds && typeof room.memberIds === 'object') {
    return room.memberIds[id] === true;
  }
  const ids = Array.isArray(room.participentIds) ? room.participentIds : [];
  return ids.some(x => String(x) === id);
}

function normalizeUserProfile(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }
  const id = user.id != null ? String(user.id) : '';
  if (!id) {
    return null;
  }
  return {
    id,
    name: String(user.name || '').trim(),
    email: String(user.email || user.user_email || '').trim(),
    phone: String(user.phone || '').trim(),
    profile_image: user.profile_image || null,
  };
}

function existingMemberIdSet(room) {
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
  return set;
}

/**
 * @returns {Promise<{ ok: boolean, added: number, error?: string }>}
 */
export async function addGroupMembers(roomId, users) {
  const rid = String(roomId || '').trim();
  if (!rid) {
    return {ok: false, added: 0, error: 'Missing group id'};
  }
  const list = Array.isArray(users) ? users : [];
  if (list.length === 0) {
    return {ok: false, added: 0, error: 'Select at least one user'};
  }

  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group') {
    return {ok: false, added: 0, error: 'Group not found'};
  }

  const memberSet = existingMemberIdSet(room);
  const participentIds = Array.isArray(room.participentIds)
    ? [...room.participentIds]
    : [];
  const participents = Array.isArray(room.participents)
    ? [...room.participents]
    : [];
  const memberIds = {...(room.memberIds || {})};

  let added = 0;
  for (const raw of list) {
    let profile = normalizeUserProfile(raw);
    if (!profile && raw?.id) {
      const doc = await fetchUserDoc(raw.id);
      profile = normalizeUserProfile(doc);
    }
    if (!profile || memberSet.has(profile.id)) {
      continue;
    }
    memberSet.add(profile.id);
    participentIds.push(profile.id);
    participents.push(profile);
    memberIds[profile.id] = true;
    added += 1;
  }

  if (added === 0) {
    return {ok: false, added: 0, error: 'No new members to add'};
  }

  await ref.update({participentIds, participents, memberIds});
  return {ok: true, added};
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function removeGroupMember(roomId, targetUserId, adminId) {
  const rid = String(roomId || '').trim();
  const target = targetUserId != null ? String(targetUserId) : '';
  const admin = adminId != null ? String(adminId) : '';

  if (!rid || !target) {
    return {ok: false, error: 'Missing group or member'};
  }
  if (admin && target === admin) {
    return {ok: false, error: 'Admin cannot be removed'};
  }

  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group') {
    return {ok: false, error: 'Group not found'};
  }

  const groupAdmin = getGroupAdminId(room);
  if (groupAdmin && target === groupAdmin) {
    return {ok: false, error: 'Admin cannot be removed'};
  }

  const participentIds = (Array.isArray(room.participentIds) ? room.participentIds : [])
    .map(x => String(x))
    .filter(x => x !== target);
  const participents = (Array.isArray(room.participents) ? room.participents : [])
    .filter(p => String(p?.id) !== target);

  const updates = {
    participentIds,
    participents,
    [`memberIds/${target}`]: null,
  };

  await ref.update(updates);
  return {ok: true};
}
