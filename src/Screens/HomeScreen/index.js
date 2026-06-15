import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useImages } from '../../Utils/Images';
import { getUser as getUserAction } from '../NewChat/redux/action';
import { getStyles } from './style';
import { useThemeColor } from '../ThemeProvider/redux/saga';
import AddButton from '../../Components/AddButton';
import database from '@react-native-firebase/database';
import {RTDB_MESSAGES_PATH} from '../../Config/firebase';
import {isGroupMember} from '../../Utils/groupMembers';
import moment from 'moment';
import { Toast } from 'react-native-toast-notifications';
import { GetFCMToken } from '../../Utils/notification';

function isHomeEntryBlocked(entry, myId, blocked, blockedBy) {
  if (!myId) {
    return false;
  }
  const mine = blocked && typeof blocked === 'object' ? blocked : {};
  const by = blockedBy && typeof blockedBy === 'object' ? blockedBy : {};
  if (entry?.type === 'group') {
    const roomKey = String(entry?.uid ?? entry?.id ?? '');
    return roomKey ? mine[roomKey] === true : false;
  }
  const sid =
    entry?.senderId != null && entry?.senderId !== ''
      ? String(entry.senderId)
      : '';
  const rid =
    entry?.receiverId != null && entry?.receiverId !== ''
      ? String(entry.receiverId)
      : '';
  const mid = String(myId);
  let peerId = '';
  if (sid === mid && rid) {
    peerId = rid;
  } else if (rid === mid && sid) {
    peerId = sid;
  }
  if (!peerId) {
    return false;
  }
  return mine[peerId] === true || by[peerId] === true;
}

function filterHomeListBySearch(entries, searchValue, userId) {
  if (!searchValue) {
    return entries || [];
  }
  const v = String(searchValue).toLowerCase();
  return (entries || []).filter(entry => {
    if (entry?.type === 'group') {
      return entry?.name?.toLowerCase().includes(v);
    }
    const targetName =
      entry?.senderId !== userId
        ? entry?.sender?.name
        : entry?.receiver?.name;
    return targetName?.toLowerCase().includes(v);
  });
}

const Home = ({ userDetail, navigation, theme }) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isActive, setIsActive] = useState('');
  const [selectedIds, setselectedIds] = useState([]);
  const [state, setState] = useState({
    loading: false,
    List: [],
    allList: [],
    unread: [],
    searchText: '',
  });

  const { loading, allList, List, searchText } = state;
  const translateX = useRef(new Animated.Value(0)).current;
  const messagesRawRef = useRef([]);
  const blockedRef = useRef({});
  const blockedByRef = useRef({});
  const searchTextRef = useRef('');

  const { images } = useImages();
  const isFocused = useIsFocused();
  const styles = getStyles(theme);
  const handleChange = (key, value) => {
    setState(pre => ({ ...pre, [key]: value }));
  };

  const selectMutipleCards = item => {
    const findId = selectedIds?.find(id => id === item?.id);
    if (findId) {
      const filterArray = selectedIds.filter(itemID => findId !== itemID);
      setselectedIds(filterArray);
    } else {
      setselectedIds(prev => [...prev, item?.id]);
    }
  };

  const snapshotToArray = snapshot => {
    if (!snapshot || typeof snapshot !== 'object') {
      return [];
    }
    return Object.entries(snapshot).flatMap(([uid, val]) => {
      if (val == null || typeof val !== 'object') {
        if (__DEV__) {
          console.warn('[HomeScreen] Skipping invalid RTDB Messages child', uid, val);
        }
        return [];
      }
      return [Object.assign(val, {uid})];
    });
  };

  const unreadList = messages => {
    const unread = messages?.filter(
      item =>
        (item?.receiverId === userDetail?.id && item?.receiverRead > 0) ||
        (item?.senderId === userDetail?.id && item?.senderRead > 0),
    );
    handleChange('unread', unread);
  };

  const sortByDate = data => {
    return data?.sort(function (a, b) {
      return (
        new Date(
          b?.messages && b?.messages?.length > 0
            ? b?.messages[b?.messages?.length - 1]?.timeStamp
            : b?.timeStamp,
        ) -
        new Date(
          a?.messages && a?.messages?.length > 0
            ? a?.messages[a?.messages?.length - 1]?.timeStamp
            : a?.timeStamp,
        )
      );
    });
  };

  const sortByUser = data => {
    const id = userDetail?.id;
    const filterArray = data?.filter(item => {
      if (item?.type === 'group') {
        return isGroupMember(item, id);
      }
      return item?.senderId === id || item?.receiverId === id;
    });
    return filterArray;
  };

  const groupSorted = data => {
    const id = userDetail?.id;
    return data?.filter(item => item?.type === 'group' && isGroupMember(item, id));
  };

  const deleteChatById = async chatId => {
    try {
      handleChange('loading', true);
      await database().ref(`${RTDB_MESSAGES_PATH}/${chatId}`).remove();
      handleChange('loading', false);
    } catch (error) {
      handleChange('loading', false);
      console.error('Error deleting chat:', error);
    }
  };

  const filtered = (key, value) => {
    handleChange(key, value);

    if (value) {
      const searchValue = value.toLowerCase();

      const filteredList = filterHomeListBySearch(
        allList,
        searchValue,
        userDetail?.id,
      );

      handleChange('List', filteredList);
    } else {
      handleChange('List', allList);
    }
  };

  useEffect(() => {
    if (isSearchActive) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => { });
    }
  }, [isSearchActive]);

  useEffect(() => {
    searchTextRef.current = searchText;
  }, [searchText]);

  useEffect(() => {
    if (!isFocused) {
      return undefined;
    }
    setIsActive('All');
    GetFCMToken();

    const auth = require('@react-native-firebase/auth').default;
    let cancelled = false;
    let timeoutId;
    let detachDb = null;

    const clearTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const stopDb = () => {
      clearTimer();
      if (detachDb) {
        detachDb();
        detachDb = null;
      }
    };

    const startDbListener = async () => {
      const u = auth().currentUser;
      if (!u) {
        handleChange('loading', false);
        handleChange('allList', []);
        handleChange('List', []);
        return;
      }
      try {
        await u.getIdToken(true);
      } catch (_) {
        /* still try RTDB; token refresh is best-effort */
      }

      if (cancelled) {
        return;
      }

      stopDb();
      if (cancelled) {
        return;
      }

      handleChange('loading', true);
      messagesRawRef.current = [];
      blockedRef.current = {};
      blockedByRef.current = {};

      const uidLocal = userDetail?.id;

      const applyMessagesAndBlocks = messages => {
        messagesRawRef.current = messages;
        const userSorted = sortByUser(messages);
        const visible = sortByDate(
          userSorted.filter(
            e =>
              !isHomeEntryBlocked(
                e,
                uidLocal,
                blockedRef.current,
                blockedByRef.current,
              ),
          ),
        );
        handleChange('allList', visible);
        unreadList(visible);
        handleChange(
          'List',
          filterHomeListBySearch(
            visible,
            searchTextRef.current,
            uidLocal,
          ),
        );
        handleChange('loading', false);
      };

      const ref = database().ref(RTDB_MESSAGES_PATH);
      const blocksRef = database().ref(`Blocks/${u.uid}/blocked`);
      const blockedByDbRef = database().ref(`BlockedBy/${u.uid}/by`);

      const onVal = snapshot => {
        const messages = snapshot.val()
          ? snapshotToArray(snapshot.val())
          : [];
        applyMessagesAndBlocks(messages);
      };
      const onBlocks = snapshot => {
        blockedRef.current = snapshot.val() || {};
        applyMessagesAndBlocks(messagesRawRef.current);
      };
      const onBlockedBy = snapshot => {
        blockedByRef.current = snapshot.val() || {};
        applyMessagesAndBlocks(messagesRawRef.current);
      };
      const onCancel = err => {
        if (__DEV__) {
          console.warn('[HomeScreen] Realtime Database /Messages:', err);
        }
        Toast.show(
          'Could not load chats. Sign in with Firebase, then publish Realtime Database rules that allow auth to read Messages (see database.rules.json in the app repo).',
          Toast.LONG,
        );
        handleChange('loading', false);
      };
      if (cancelled) {
        handleChange('loading', false);
        return;
      }

      ref.on('value', onVal, onCancel);
      blocksRef.on('value', onBlocks);
      blockedByDbRef.on('value', onBlockedBy);
      detachDb = () => {
        ref.off('value', onVal);
        blocksRef.off('value', onBlocks);
        blockedByDbRef.off('value', onBlockedBy);
      };

      timeoutId = setTimeout(() => {
        setState(prev => {
          if (!prev.loading) {
            return prev;
          }
          Toast.show(
            'Still waiting for chat data. Check network and Firebase project config.',
            Toast.LONG,
          );
          return {...prev, loading: false};
        });
      }, 15000);
    };

    const unsubAuth = auth().onAuthStateChanged(user => {
      if (cancelled) {
        return;
      }
      stopDb();
      if (!user) {
        handleChange('loading', false);
        handleChange('allList', []);
        handleChange('List', []);
        return;
      }
      startDbListener();
    });

    return () => {
      cancelled = true;
      unsubAuth();
      stopDb();
    };
  }, [isFocused, userDetail?.id]);

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const searchBar = useThemeColor('inputBackground');
  const buttonColor = useThemeColor('buttonColor');
  const borderColor = useThemeColor('border');
  const placeholderColor = useThemeColor('placeholder');
  const headerTextColor = useThemeColor('headerText');
  const textOnButton = useThemeColor('textOnButton');
  const chipInactive = useThemeColor('chipInactive');

  const group = List?.filter(item => item.type == 'group');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: backgroundColor }]}>
      <StatusBar
        animated={true}
        backgroundColor={headerBackgroundColor}
        barStyle={'light-content'}
      />

      <View style={[styles.header, { backgroundColor: headerBackgroundColor, borderBottomColor: borderColor }]}>
        {!isSearchActive ? (
          <>
            <Text style={styles.headerText}>Connect Vibe</Text>
            <Pressable onPress={() => setIsSearchActive(true)}>
              <EvilIcons size={28} color={headerTextColor} name={'search'} />
            </Pressable>
          </>
        ) : (
          <Animated.View
            style={[
              styles.searchContainer,
              { transform: [{ translateX }], backgroundColor: searchBar, borderWidth: 1, borderColor },
            ]}>
            <View
              style={{
                flexDirection: 'row',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}>
              <Pressable
                onPress={() => {
                  setIsSearchActive(false),
                    handleChange('searchText', ''),
                    handleChange('List', allList);
                }}
                style={{ marginHorizontal: 5 }}>
                <Ionicons size={20} color={textColor} name={'arrow-back'} />
              </Pressable>
              <TextInput
                value={searchText}
                placeholderTextColor={placeholderColor}
                placeholder="Search conversations"
                style={{ flex: 1, color: textColor, textAlign: 'left' }}
                onChangeText={value => filtered('searchText', value)}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          width: 160,
          justifyContent: 'space-between',
          marginTop: 16,
          marginHorizontal: 16,
        }}>
        <TouchableOpacity
          style={{
            borderRadius: 20,
            paddingHorizontal: 16,
            height: 36,
            backgroundColor:
              isActive == 'All' ? buttonColor : chipInactive,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: isActive == 'All' ? 0 : 1,
            borderColor,
          }}
          onPress={() => setIsActive('All')}>
          <Text style={{ color: isActive == 'All' ? textOnButton : textSecondary, fontWeight: '500' }}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            borderRadius: 20,
            paddingHorizontal: 16,
            height: 36,
            backgroundColor:
              isActive == 'Groups' ? buttonColor : chipInactive,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: isActive == 'Groups' ? 0 : 1,
            borderColor,
          }}
          onPress={() => setIsActive('Groups')}>
          <Text style={{ color: isActive == 'Groups' ? textOnButton : textSecondary, fontWeight: '500' }}>Groups</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ marginVertical: '50%' }}>
          <ActivityIndicator size="small" color={textColor} />
        </View>
      ) : isActive == 'All' ? (
        <FlatList
          data={List}
          numColumns={1}
          style={{ width: '100%' }}
          noIndent={true}
          keyExtractor={item => item?.timeStamp}
          ListEmptyComponent={() => (
            <View
              style={{
                width: '100%',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  marginTop: 20,
                  color: textColor,
                }}>
                You have no messages
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            const lastMessage =
              item?.messages &&
                Array.isArray(item.messages) &&
                item.messages.length > 0
                ? item.messages[item.messages.length - 1]
                : null;

            const timeStamp =
              Array.isArray(item?.messages) &&
              item.messages.length > 0 &&
              moment(
                item.messages[item.messages.length - 1]?.timeStamp,
              ).fromNow();

            const messagePreview = lastMessage
              ? lastMessage.type === 'image'
                ? 'Sent a photo'
                : lastMessage.text.length > 30
                  ? lastMessage.text.slice(0, 30) + ' ....'
                  : lastMessage.text
              : '';
            return (
              <>
                {lastMessage && (
                  <TouchableOpacity
                    style={[
                      styles.chatContainer,
                      {
                        borderColor,
                      },
                    ]}
                    onPress={() => {
                      if (item?.type === 'group') {
                        navigation.navigate('GroupChat', {
                          messageuid: item.id,
                        });
                      } else {
                        navigation.navigate('Chat', {
                          messageuid: item?.id,
                          data: item,
                        });
                      }
                    }}
                    onLongPress={() => {
                      if (item.type == 'group') {
                        item.senderId == userDetail?.id
                          ? deleteChatById(item.id)
                          : Toast.show('You cannot delete this chat');
                      } else {
                        deleteChatById(item.id);
                      }
                    }}>
                    <View style={styles.imageContainer}>
                      <Image
                        source={
                          item?.type === 'group'
                            ? images.groupImage
                            : item?.senderId === userDetail?.id
                              ? (item?.receiver?.profile_image && typeof item?.receiver?.profile_image === 'string')
                                ? { uri: item?.receiver?.profile_image }
                                : images.profile
                              : item?.senderId !== userDetail?.id
                                ? (item?.sender?.profile_image && typeof item?.sender?.profile_image === 'string')
                                  ? { uri: item?.sender?.profile_image }
                                  : images.profile
                                : images.profile
                        }
                        style={styles.image}
                      />
                    </View>
                    <View style={styles.textContainer} key={index}>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.userName, { color: textColor }]}>
                          {item?.type === 'group'
                            ? item?.name
                            : item?.senderId === userDetail?.id
                              ? item?.receiver?.name
                              : item?.sender?.name}
                        </Text>
                        <Text
                          style={[styles.message, { color: textSecondary }]}
                          numberOfLines={1}>
                          {messagePreview}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dateView}>
                      <Text style={styles.date}>
                        {timeStamp == 'a few seconds ago'
                          ? 'Just Now'
                          : timeStamp}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            );
          }}
        />
      ) : (
        <FlatList
          data={groupSorted(sortByDate(group))}
          numColumns={1}
          style={{ width: '100%' }}
          noIndent={true}
          keyExtractor={item => item?.timeStamp}
          ListEmptyComponent={() => (
            <View
              style={{
                width: '100%',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  marginTop: 20,
                  color: textColor,
                }}>
                You have no messages
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            const lastMessage =
              item?.messages &&
                Array.isArray(item.messages) &&
                item.messages.length > 0
                ? item.messages[item.messages.length - 1]
                : null;

            const timeStamp =
              Array.isArray(item?.messages) &&
              item.messages.length > 0 &&
              moment(
                item.messages[item.messages.length - 1]?.timeStamp,
              ).fromNow();

            const messagePreview = lastMessage
              ? lastMessage.type === 'image'
                ? 'Sent a photo'
                : lastMessage.text.length > 30
                  ? lastMessage.text.slice(0, 30) + ' ....'
                  : lastMessage.text
              : '';
            return (
              <>
                {lastMessage && (
                  <TouchableOpacity
                    style={[
                      styles.chatContainer,
                      {
                        borderColor,
                      },
                    ]}
                    onPress={() => {
                      navigation.navigate('GroupChat', {
                        messageuid: item.id,
                        data: item,
                      });
                    }}>
                    <View style={[styles.imageContainer]}>
                      <Image
                        source={
                          item?.type == 'group'
                            ? images.groupImage
                            : item?.senderId === userDetail?.id
                              ? (item?.receiver?.profile_image && typeof item?.receiver?.profile_image === 'string')
                                ? { uri: item?.receiver?.profile_image }
                                : images.profile
                              : (item?.receiver?.profile_image && typeof item?.receiver?.profile_image === 'string')
                                ? { uri: item?.receiver?.profile_image }
                                : images.profile
                        }
                        style={styles.image}
                      />
                    </View>
                    <View style={styles.textContainer} key={index}>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.userName, { color: textColor }]}>
                          {item?.type === 'group'
                            ? item?.name
                            : item?.senderId === userDetail?.id
                              ? item?.receiver?.name
                              : item?.sender?.name}
                        </Text>
                        <Text
                          style={[styles.message, { color: textSecondary }]}
                          numberOfLines={1}>
                          {messagePreview}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dateView}>
                      <Text style={styles.date}>
                        {timeStamp == 'a few seconds ago'
                          ? 'Just Now'
                          : timeStamp}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            );
          }}
        />
      )}

      <AddButton />
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  userDetail: state?.login?.userDetail?.user,
  userSearched: state?.searchUser?.profile,
  theme: state?.themes?.theme,
});

const mapDispatchToProps = dispatch => ({
  getProfileAction: data => dispatch(getProfileAction(data)),
  getUserAction: data => dispatch(getUserAction(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Home);
