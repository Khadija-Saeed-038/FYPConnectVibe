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

export function getMemberDisplayName(room, userId, fallbackUser = null) {
  const id = userId != null ? String(userId) : '';
  if (!id) {
    return 'User';
  }
  const list = Array.isArray(room?.participents) ? room.participents : [];
  const p = list.find(x => String(x?.id) === id);
  const fromParticipant = p ? String(p.name || '').trim() : '';
  if (fromParticipant) {
    return fromParticipant;
  }
  const fromFallback =
    fallbackUser && String(fallbackUser.id) === id
      ? String(fallbackUser.name || '').trim()
      : '';
  if (fromFallback) {
    return fromFallback;
  }
  return `User ${id.slice(-4)}`;
}

export function activeMemberIdSet(room) {
  const set = new Set();
  if (room?.memberIds && typeof room.memberIds === 'object') {
    Object.keys(room.memberIds).forEach(k => {
      if (room.memberIds[k] === true) {
        set.add(String(k));
      }
    });
  }
  if (set.size > 0) {
    return set;
  }
  const ids = Array.isArray(room?.participentIds) ? room.participentIds : [];
  ids.forEach(x => {
    if (x != null) {
      set.add(String(x));
    }
  });
  return set;
}

function adminCheckResult(room, callerId) {
  if (!isGroupAdmin(room, callerId)) {
    return {ok: false, error: 'Only the group admin can do this'};
  }
  return {ok: true};
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
  return activeMemberIdSet(room);
}

function formatAddedNames(callerName, profiles) {
  const names = profiles.map(
    p => p.name || `User ${String(p.id).slice(-4)}`,
  );
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return `${callerName} added ${names[0]}`;
  }
  if (names.length === 2) {
    return `${callerName} added ${names[0]} and ${names[1]}`;
  }
  return `${callerName} added ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/**
 * One-time client patch for groups created before adminId existed.
 */
export async function backfillGroupAdminIdIfNeeded(roomId) {
  const rid = String(roomId || '').trim();
  if (!rid) {
    return;
  }
  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group' || room.adminId) {
    return;
  }
  const senderId = room.senderId != null ? String(room.senderId) : '';
  if (!senderId) {
    return;
  }
  await ref.update({adminId: senderId});
}

export async function appendGroupSystemMessage(roomId, text) {
  const rid = String(roomId || '').trim();
  const msg = String(text || '').trim();
  if (!rid || !msg) {
    return;
  }
  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room) {
    return;
  }
  const messages = [...(room.messages || [])];
  messages.push({type: 'system', text: msg, timeStamp: Date.now()});
  await ref.update({messages, timeStamp: Date.now()});
}

/**
 * @returns {Promise<{ ok: boolean, added: number, error?: string }>}
 */
export async function addGroupMembers(roomId, users, callerId, callerProfile = null) {
  const rid = String(roomId || '').trim();
  const caller = callerId != null ? String(callerId) : '';
  if (!rid) {
    return {ok: false, added: 0, error: 'Missing group id'};
  }
  if (!caller) {
    return {ok: false, added: 0, error: 'Sign in required'};
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

  const adminCheck = adminCheckResult(room, caller);
  if (!adminCheck.ok) {
    return {ok: false, added: 0, error: adminCheck.error};
  }

  const memberSet = existingMemberIdSet(room);
  const participentIds = Array.isArray(room.participentIds)
    ? [...room.participentIds]
    : [];
  const participents = Array.isArray(room.participents)
    ? [...room.participents]
    : [];
  const memberIds = {...(room.memberIds || {})};

  const addedProfiles = [];
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
    addedProfiles.push(profile);
    added += 1;
  }

  if (added === 0) {
    return {ok: false, added: 0, error: 'No new members to add'};
  }

  await ref.update({participentIds, participents, memberIds});

  const callerName = getMemberDisplayName(room, caller, callerProfile);
  const systemText = formatAddedNames(callerName, addedProfiles);
  if (systemText) {
    await appendGroupSystemMessage(rid, systemText);
  }

  return {ok: true, added};
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function removeGroupMember(
  roomId,
  targetUserId,
  callerId,
  callerProfile = null,
) {
  const rid = String(roomId || '').trim();
  const target = targetUserId != null ? String(targetUserId) : '';
  const caller = callerId != null ? String(callerId) : '';

  if (!rid || !target) {
    return {ok: false, error: 'Missing group or member'};
  }
  if (!caller) {
    return {ok: false, error: 'Sign in required'};
  }

  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group') {
    return {ok: false, error: 'Group not found'};
  }

  const adminCheck = adminCheckResult(room, caller);
  if (!adminCheck.ok) {
    return {ok: false, error: adminCheck.error};
  }

  const groupAdmin = getGroupAdminId(room);
  if (groupAdmin && target === groupAdmin) {
    return {ok: false, error: 'Admin cannot be removed'};
  }

  const participentIds = (
    Array.isArray(room.participentIds) ? room.participentIds : []
  )
    .map(x => String(x))
    .filter(x => x !== target);
  const participents = (
    Array.isArray(room.participents) ? room.participents : []
  ).filter(p => String(p?.id) !== target);

  const updates = {
    participentIds,
    participents,
    [`memberIds/${target}`]: null,
  };

  await ref.update(updates);

  const callerName = getMemberDisplayName(room, caller, callerProfile);
  const targetName = getMemberDisplayName(room, target);
  await appendGroupSystemMessage(rid, `${callerName} removed ${targetName}`);

  return {ok: true};
}

/**
 * @returns {Promise<{ ok: boolean, deleted?: boolean, error?: string }>}
 */
export async function leaveGroup(roomId, userId, userProfile = null) {
  const rid = String(roomId || '').trim();
  const uid = userId != null ? String(userId) : '';

  if (!rid || !uid) {
    return {ok: false, error: 'Missing group or user'};
  }

  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group') {
    return {ok: false, error: 'Group not found'};
  }
  if (!isGroupMember(room, uid)) {
    return {ok: false, error: 'Not a member of this group'};
  }

  const leaverName = getMemberDisplayName(room, uid, userProfile);
  const wasAdmin = isGroupAdmin(room, uid);

  const participentIds = (
    Array.isArray(room.participentIds) ? room.participentIds : []
  )
    .map(x => String(x))
    .filter(x => x !== uid);
  const participents = (
    Array.isArray(room.participents) ? room.participents : []
  ).filter(p => String(p?.id) !== uid);

  if (participentIds.length === 0) {
    await ref.remove();
    return {ok: true, deleted: true};
  }

  const updates = {
    participentIds,
    participents,
    [`memberIds/${uid}`]: null,
  };

  let newAdminId = '';
  if (wasAdmin) {
    newAdminId = participentIds[0] || '';
    if (newAdminId) {
      updates.adminId = newAdminId;
    }
  }

  await ref.update(updates);
  await appendGroupSystemMessage(rid, `${leaverName} left`);

  if (wasAdmin && newAdminId) {
    const updatedSnap = await ref.once('value');
    const updatedRoom = updatedSnap.val();
    const newAdminName = getMemberDisplayName(updatedRoom, newAdminId);
    await appendGroupSystemMessage(rid, `${newAdminName} is now an admin`);
  }

  return {ok: true, deleted: false};
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function renameGroup(roomId, name, callerId, callerProfile = null) {
  const rid = String(roomId || '').trim();
  const caller = callerId != null ? String(callerId) : '';
  const newName = String(name || '').trim();

  if (!rid || !newName) {
    return {ok: false, error: 'Enter a group name'};
  }
  if (!caller) {
    return {ok: false, error: 'Sign in required'};
  }

  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group') {
    return {ok: false, error: 'Group not found'};
  }

  const adminCheck = adminCheckResult(room, caller);
  if (!adminCheck.ok) {
    return {ok: false, error: adminCheck.error};
  }

  await ref.update({name: newName});

  const callerName = getMemberDisplayName(room, caller, callerProfile);
  await appendGroupSystemMessage(
    rid,
    `${callerName} changed the group name to "${newName}"`,
  );

  return {ok: true};
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function transferGroupAdmin(
  roomId,
  callerId,
  newAdminId,
  callerProfile = null,
) {
  const rid = String(roomId || '').trim();
  const caller = callerId != null ? String(callerId) : '';
  const target = newAdminId != null ? String(newAdminId) : '';

  if (!rid || !target) {
    return {ok: false, error: 'Missing group or member'};
  }
  if (!caller) {
    return {ok: false, error: 'Sign in required'};
  }

  const ref = database().ref(`${RTDB_MESSAGES_PATH}/${rid}`);
  const snap = await ref.once('value');
  const room = snap.val();
  if (!room || room.type !== 'group') {
    return {ok: false, error: 'Group not found'};
  }

  const adminCheck = adminCheckResult(room, caller);
  if (!adminCheck.ok) {
    return {ok: false, error: adminCheck.error};
  }
  if (caller === target) {
    return {ok: false, error: 'Already the group admin'};
  }
  if (!isGroupMember(room, target)) {
    return {ok: false, error: 'User is not a member'};
  }

  await ref.update({adminId: target});

  const newAdminName = getMemberDisplayName(room, target);
  await appendGroupSystemMessage(rid, `${newAdminName} is now an admin`);

  return {ok: true};
}
