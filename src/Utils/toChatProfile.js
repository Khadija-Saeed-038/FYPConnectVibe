/**
 * Plain RTDB-safe user objects for chat rooms.
 * @param {object|undefined|null} u
 */
export function toChatProfile(u) {
  if (!u) {
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      profile_image: null,
    };
  }
  return {
    id: u.id != null ? String(u.id) : '',
    name: u.name ?? '',
    email: u.email ?? '',
    phone: u.phone ?? '',
    profile_image: u.profile_image ?? null,
  };
}

/**
 * route.params.data is either a Firestore search hit / peer user, or a full room object from Home.
 * @param {*} data
 * @param {string|number} currentUserId
 */
export function getPeerFromRouteData(data, currentUserId) {
  if (!data) {
    return null;
  }
  const uid =
    currentUserId != null && currentUserId !== ''
      ? String(currentUserId)
      : '';
  if (data.sender && data.receiver && data.senderId != null) {
    return String(data.senderId) === uid ? data.receiver : data.sender;
  }
  if (data.id != null) {
    return data;
  }
  return null;
}
