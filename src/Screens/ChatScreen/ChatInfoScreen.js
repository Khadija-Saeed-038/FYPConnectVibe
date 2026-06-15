import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {RTDB_MESSAGES_PATH} from '../../Config/firebase';
import {
  displayName,
  fetchUserDoc,
  phoneLine,
  resolveBlockedMapToRows,
} from '../../Utils/blockedUsersList';
import {
  getGroupAdminId,
  isGroupAdmin,
  removeGroupMember,
} from '../../Utils/groupMembers';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import {getStyles} from './style';
import {openDirectChat} from '../../Utils/openDirectChat';
import {Toast} from 'react-native-toast-notifications';

function buildDmMemberRows(roomVal, userDetail) {
  const myId = userDetail?.id != null ? String(userDetail.id) : '';
  const sid =
    roomVal?.senderId != null ? String(roomVal.senderId) : '';
  const rid =
    roomVal?.receiverId != null ? String(roomVal.receiverId) : '';
  const rows = [];
  const seen = new Set();

  const pushRow = (id, profile, isYou) => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    const p =
      profile && typeof profile === 'object'
        ? profile
        : isYou
          ? userDetail
          : null;
    rows.push({
      id,
      isYou,
      profile: p || {id, name: '', email: '', phone: ''},
    });
  };

  if (sid) {
    pushRow(sid, roomVal?.sender, sid === myId);
  }
  if (rid) {
    pushRow(rid, roomVal?.receiver, rid === myId);
  }

  if (rows.length === 0 && myId) {
    pushRow(myId, userDetail, true);
  }

  return rows.map(r => ({
    key: r.id,
    peerId: r.id,
    isYou: r.isYou,
    profile: r.profile,
    title: r.isYou
      ? `${displayName(r.profile, r.id)} (you)`
      : displayName(r.profile, r.id),
    subtitle: phoneLine(r.isYou ? userDetail : r.profile),
  }));
}

async function buildGroupMemberRows(roomVal, userDetail) {
  const myId = userDetail?.id != null ? String(userDetail.id) : '';
  const adminId = getGroupAdminId(roomVal);
  const list = Array.isArray(roomVal?.participents)
    ? roomVal.participents
    : [];
  if (list.length > 0) {
    return list.map((p, i) => {
      const id = p?.id != null ? String(p.id) : String(i);
      const isYou = myId && id === myId;
      const isAdmin = adminId && id === adminId;
      const baseTitle = isYou ? `${displayName(p, id)} (you)` : displayName(p, id);
      return {
        key: id,
        peerId: id,
        isYou,
        isAdmin,
        profile: isYou ? userDetail : p,
        title: isAdmin ? `${baseTitle} (admin)` : baseTitle,
        subtitle: phoneLine(isYou ? userDetail : p),
      };
    });
  }

  const ids = Array.isArray(roomVal?.participentIds)
    ? roomVal.participentIds.map(x => String(x)).filter(Boolean)
    : [];
  if (ids.length === 0) {
    return [];
  }
  const profiles = await Promise.all(ids.map(id => fetchUserDoc(id)));
  return profiles.map((p, i) => {
    const id = p?.id || ids[i];
    const sid = String(id);
    const isYou = myId && sid === myId;
    const isAdmin = adminId && sid === adminId;
    const baseTitle = isYou ? `${displayName(p, id)} (you)` : displayName(p, id);
    return {
      key: sid,
      peerId: sid,
      isYou,
      isAdmin,
      profile: isYou ? userDetail : p,
      title: isAdmin ? `${baseTitle} (admin)` : baseTitle,
      subtitle: phoneLine(isYou ? userDetail : p),
    };
  });
}

const ChatInfoScreen = ({navigation, route, theme, userDetail}) => {
  const {messageuid, kind} = route.params || {};
  const styles = getStyles(theme);
  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');
  const buttonColor = useThemeColor('buttonColor');
  const inputBackground = useThemeColor('inputBackground');

  const [roomLoading, setRoomLoading] = useState(true);
  const [roomVal, setRoomVal] = useState(null);
  const [memberRows, setMemberRows] = useState([]);
  const [blockedRows, setBlockedRows] = useState([]);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [messageBusy, setMessageBusy] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  const kindNorm = kind === 'group' ? 'group' : 'dm';
  const myId = userDetail?.id != null ? String(userDetail.id) : '';
  const userIsGroupAdmin = useMemo(
    () => kindNorm === 'group' && isGroupAdmin(roomVal, myId),
    [kindNorm, roomVal, myId],
  );

  const resolveBlockedList = useCallback(async blockedMap => {
    const rows = await resolveBlockedMapToRows(blockedMap || {});
    setBlockedRows(rows);
    setPrivacyLoading(false);
  }, []);

  useEffect(() => {
    if (!messageuid) {
      setRoomLoading(false);
      setMemberRows([]);
      return undefined;
    }
    setRoomLoading(true);
    const ref = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
    const onVal = async snapshot => {
      const val = snapshot.val();
      if (!val) {
        setRoomVal(null);
        setMemberRows([]);
        setRoomLoading(false);
        return;
      }
      setRoomVal(val);
      try {
        if (kindNorm === 'group') {
          const rows = await buildGroupMemberRows(val, userDetail);
          setMemberRows(rows);
        } else {
          setMemberRows(buildDmMemberRows(val, userDetail));
        }
      } catch (e) {
        if (__DEV__) {
          console.warn('[ChatInfo] members build failed', e);
        }
        setMemberRows([]);
      } finally {
        setRoomLoading(false);
      }
    };
    ref.on('value', onVal);
    return () => ref.off('value', onVal);
  }, [messageuid, kindNorm, userDetail]);

  useEffect(() => {
    const u = auth().currentUser;
    if (!u?.uid) {
      setBlockedRows([]);
      setPrivacyLoading(false);
      return undefined;
    }
    setPrivacyLoading(true);
    const ref = database().ref(`Blocks/${u.uid}/blocked`);
    const onVal = snap => {
      resolveBlockedList(snap.val() || {});
    };
    ref.on('value', onVal);
    return () => ref.off('value', onVal);
  }, [resolveBlockedList]);

  const title = useMemo(() => {
    if (kindNorm === 'group') {
      return 'Group info';
    }
    return 'Chat info';
  }, [kindNorm]);

  const confirmRemoveMember = member => {
    if (!member?.peerId || !messageuid) {
      return;
    }
    Alert.alert(
      'Remove from group',
      `Remove ${member.title?.replace(/\s*\(admin\)\s*/i, '').replace(/\s*\(you\)\s*/i, '').trim() || 'this member'} from the group?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoveBusy(true);
            try {
              const r = await removeGroupMember(
                messageuid,
                member.peerId,
                getGroupAdminId(roomVal),
              );
              if (!r.ok) {
                Toast.show(r.error || 'Could not remove member');
                return;
              }
              Toast.show('Member removed');
              setSelectedMember(null);
            } catch (e) {
              const code = e?.code || '';
              const msg = String(e?.message || '');
              if (code === 'PERMISSION_DENIED' || /permission/i.test(msg)) {
                Toast.show('Only the group admin can remove members');
              } else {
                Toast.show('Something went wrong');
              }
            } finally {
              setRemoveBusy(false);
            }
          },
        },
      ],
    );
  };

  const canRemoveSelected =
    kindNorm === 'group' &&
    userIsGroupAdmin &&
    selectedMember?.peerId &&
    !selectedMember?.isYou &&
    !selectedMember?.isAdmin;

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: backgroundColor}]}>
      <StatusBar
        animated
        backgroundColor={headerBackgroundColor}
        barStyle="light-content"
      />
      <View
        style={[
          styles.header,
          {backgroundColor: headerBackgroundColor, borderBottomColor: borderColor},
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{justifyContent: 'center', height: 45}}>
          <Ionicons size={25} color={headerTextColor} name="arrow-back" />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: 8, justifyContent: 'center'}}>
          <Text style={[styles.userName, {color: headerTextColor}]}>{title}</Text>
        </View>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 32}}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: textColor,
            marginBottom: 8,
            opacity: 0.85,
          }}>
          Members
        </Text>
        {kindNorm === 'group' && userIsGroupAdmin && !roomLoading ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('AddGroupMembers', {messageuid})
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: inputBackground,
            }}>
            <Ionicons name="person-add-outline" size={20} color={buttonColor} />
            <Text
              style={{
                color: buttonColor,
                fontWeight: '600',
                marginLeft: 8,
                fontSize: 15,
              }}>
              Add members
            </Text>
          </TouchableOpacity>
        ) : null}
        {roomLoading ? (
          <ActivityIndicator color={textColor} style={{marginVertical: 16}} />
        ) : memberRows.length === 0 ? (
          <Text style={{color: textColor, opacity: 0.7}}>
            No member details available.
          </Text>
        ) : (
          memberRows.map(row => {
            const tappable = Boolean(row.peerId && !row.isYou);
            const rowStyle = {
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: `${textColor}22`,
            };
            const content = (
              <>
                <Text style={{color: textColor, fontSize: 16, fontWeight: '500'}}>
                  {row.title}
                </Text>
                <Text
                  style={{
                    color: textColor,
                    fontSize: 14,
                    marginTop: 4,
                    opacity: 0.8,
                  }}>
                  {row.subtitle}
                </Text>
              </>
            );
            if (tappable) {
              return (
                <TouchableOpacity
                  key={row.key}
                  activeOpacity={0.7}
                  onPress={() =>
                    setSelectedMember({
                      peerId: row.peerId,
                      profile: row.profile,
                      title: row.title,
                      subtitle: row.subtitle,
                      isYou: row.isYou,
                      isAdmin: row.isAdmin,
                    })
                  }
                  style={rowStyle}>
                  {content}
                </TouchableOpacity>
              );
            }
            return (
              <View key={row.key} style={rowStyle}>
                {content}
              </View>
            );
          })
        )}

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: textColor,
            marginTop: 28,
            marginBottom: 8,
            opacity: 0.85,
          }}>
          Privacy
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: textColor,
            opacity: 0.65,
            marginBottom: 10,
          }}>
          Blocked users and blocked group threads appear here.
        </Text>
        {privacyLoading ? (
          <ActivityIndicator color={textColor} style={{marginVertical: 16}} />
        ) : blockedRows.length === 0 ? (
          <Text style={{color: textColor, opacity: 0.7}}>
            No blocked users or threads.
          </Text>
        ) : (
          blockedRows.map(row => (
            <View
              key={row.key}
              style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: `${textColor}22`,
              }}>
              <Text style={{color: textColor, fontSize: 16, fontWeight: '500'}}>
                {row.title}
              </Text>
              <Text
                style={{
                  color: textColor,
                  fontSize: 14,
                  marginTop: 4,
                  opacity: 0.8,
                }}>
                {row.subtitle}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        transparent
        visible={selectedMember != null}
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}>
          <View
            style={{
              backgroundColor: inputBackground,
              borderRadius: 12,
              padding: 18,
            }}>
            <Text
              style={{
                color: textColor,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 12,
              }}>
              {selectedMember?.title ?? ''}
            </Text>
            <Text
              style={{
                color: textColor,
                fontSize: 13,
                opacity: 0.65,
                marginBottom: 4,
              }}>
              Phone
            </Text>
            <Text style={{color: textColor, fontSize: 15, fontWeight: '500'}}>
              {selectedMember?.subtitle ?? 'No phone number'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 20,
                gap: 12,
                flexWrap: 'wrap',
              }}>
              {canRemoveSelected ? (
                <TouchableOpacity
                  disabled={removeBusy}
                  onPress={() => confirmRemoveMember(selectedMember)}
                  style={{paddingVertical: 10, paddingHorizontal: 8}}>
                  <Text style={{color: '#c62828', fontWeight: '600'}}>
                    {removeBusy ? '…' : 'Remove from group'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => setSelectedMember(null)}
                style={{paddingVertical: 10, paddingHorizontal: 8}}>
                <Text style={{color: textColor}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={messageBusy}
                onPress={async () => {
                  if (!selectedMember?.peerId) {
                    return;
                  }
                  const peer = {
                    ...(selectedMember.profile || {}),
                    id: selectedMember.peerId,
                  };
                  setMessageBusy(true);
                  const r = await openDirectChat({
                    navigation,
                    userDetail,
                    peer,
                  });
                  setMessageBusy(false);
                  if (r.ok) {
                    setSelectedMember(null);
                  }
                }}
                style={{paddingVertical: 10, paddingHorizontal: 8}}>
                <Text style={{color: buttonColor, fontWeight: '600'}}>
                  {messageBusy ? '…' : 'Message'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
  userDetail: state?.login?.userDetail?.user,
});

export default connect(mapStateToProps)(ChatInfoScreen);
