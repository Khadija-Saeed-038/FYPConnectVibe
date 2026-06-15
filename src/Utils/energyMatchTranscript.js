/**
 * Map Firebase RTDB message rows to Django /api/reflections/from-transcript/ payload.
 * @param {Array<{text?: string, type?: string, senderId?: string|number}>} messages
 * @param {{id?: string|number, name?: string}[]} [participants] Group `participents` from RTDB.
 */
export function buildTranscriptPayloadFromFirebaseMessages(
  messages,
  userDetail,
  peer,
  participants,
) {
  const byParticipantId = new Map();
  if (Array.isArray(participants)) {
    for (const p of participants) {
      if (p?.id == null) {
        continue;
      }
      byParticipantId.set(
        String(p.id),
        String(p.name || p.id).slice(0, 150),
      );
    }
  }

  const labelFor = senderId => {
    const sid = String(senderId ?? '');
    if (sid === String(userDetail?.id)) {
      return String(userDetail?.name || 'You').slice(0, 150);
    }
    if (peer?.id != null && sid === String(peer.id)) {
      return String(peer?.name || 'Peer').slice(0, 150);
    }
    if (byParticipantId.has(sid)) {
      return byParticipantId.get(sid);
    }
    return sid || 'unknown';
  };

  const out = [];
  for (const m of messages || []) {
    const type = m?.type || 'text';
    const raw = m?.text != null ? String(m.text) : '';
    const content =
      type === 'text' ? raw : `[${type}] ${raw}`.trim().slice(0, 4000);
    if (!content.trim()) {
      continue;
    }
    out.push({
      content,
      sender: labelFor(m?.senderId),
    });
  }
  return {messages: out};
}
