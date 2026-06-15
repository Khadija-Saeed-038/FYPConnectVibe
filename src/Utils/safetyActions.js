import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

/**
 * @param {{ reportedUserId: string, reason: string, roomId?: string, kind?: string }} params
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function submitRtdbReport({
  reportedUserId,
  reason,
  roomId,
  kind,
}) {
  const user = auth().currentUser;
  if (!user) {
    return {ok: false, error: 'NOT_SIGNED_IN'};
  }
  const uid = user.uid;
  const payload = {
    reporterId: uid,
    reportedUserId: String(reportedUserId || '').trim(),
    reason: String(reason || '').trim() || 'unspecified',
    createdAt: database.ServerValue.TIMESTAMP,
  };
  if (roomId != null && roomId !== '') {
    payload.roomId = String(roomId);
  }
  if (kind != null && kind !== '') {
    payload.kind = String(kind);
  }
  if (!payload.reportedUserId) {
    return {ok: false, error: 'MISSING_REPORTED_ID'};
  }
  try {
    await database().ref('Reports').push().set(payload);
    return {ok: true};
  } catch (e) {
    return {ok: false, error: e?.message || 'REPORT_FAILED'};
  }
}

/**
 * @param {{ blockerId: string, blockedKey: string }} params blockedKey = peer user id (1:1) or room id (group)
 */
export async function blockRtdbTarget({blockerId, blockedKey}) {
  const user = auth().currentUser;
  if (!user || user.uid !== blockerId) {
    return {ok: false, error: 'NOT_SIGNED_IN'};
  }
  const key = String(blockedKey || '').trim();
  if (!key) {
    return {ok: false, error: 'MISSING_BLOCKED_KEY'};
  }
  try {
    await database().ref().update({
      [`Blocks/${blockerId}/blocked/${key}`]: true,
      [`BlockedBy/${key}/by/${blockerId}`]: true,
    });
    return {ok: true};
  } catch (e) {
    return {ok: false, error: e?.message || 'BLOCK_FAILED'};
  }
}
