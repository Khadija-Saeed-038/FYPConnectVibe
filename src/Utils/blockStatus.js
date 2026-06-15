import database from '@react-native-firebase/database';

function isBlockedFlag(value) {
  return value === true || value === 'true';
}

/**
 * True if either user blocked the other (1:1 DM).
 */
export function isDmBlocked(myId, peerId, myBlockedMap, blockedByMap) {
  if (!myId || !peerId) {
    return false;
  }
  const peer = String(peerId);
  const mine = myBlockedMap && typeof myBlockedMap === 'object' ? myBlockedMap : {};
  const by = blockedByMap && typeof blockedByMap === 'object' ? blockedByMap : {};
  return isBlockedFlag(mine[peer]) || isBlockedFlag(by[peer]);
}

/**
 * @returns {Promise<{ blocked: boolean, iBlockedThem: boolean, theyBlockedMe: boolean }>}
 */
export async function fetchDmBlockStatus(myId, peerId) {
  const a = String(myId || '').trim();
  const b = String(peerId || '').trim();
  if (!a || !b || a === b) {
    return {blocked: false, iBlockedThem: false, theyBlockedMe: false};
  }
  try {
    const [mineSnap, bySnap] = await Promise.all([
      database().ref(`Blocks/${a}/blocked/${b}`).once('value'),
      database().ref(`BlockedBy/${a}/by/${b}`).once('value'),
    ]);
    const iBlockedThem = isBlockedFlag(mineSnap.val());
    const theyBlockedMe = isBlockedFlag(bySnap.val());
    return {
      blocked: iBlockedThem || theyBlockedMe,
      iBlockedThem,
      theyBlockedMe,
    };
  } catch {
    return {blocked: false, iBlockedThem: false, theyBlockedMe: false};
  }
}

export function dmBlockReason(myId, peerId, myBlockedMap, blockedByMap) {
  if (!isDmBlocked(myId, peerId, myBlockedMap, blockedByMap)) {
    return null;
  }
  const peer = String(peerId);
  if (isBlockedFlag(myBlockedMap?.[peer])) {
    return 'You blocked this user';
  }
  if (isBlockedFlag(blockedByMap?.[peer])) {
    return "You can't message this user";
  }
  return 'Messaging is not available';
}
