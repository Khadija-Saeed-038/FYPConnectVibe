import {
  Image,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutAnimation,
  UIManager,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useRef, useMemo, useEffect} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {RTDB_MESSAGES_PATH} from '../../Config/firebase';
import {blockRtdbTarget, submitRtdbReport} from '../../Utils/safetyActions';
import {dmBlockReason} from '../../Utils/blockStatus';
import {showChatSafetyMenu, promptReportReason} from '../../Utils/safetyMenu';
import {
  toChatProfile,
  getPeerFromRouteData,
} from '../../Utils/toChatProfile';

import ImageCropPicker from 'react-native-image-crop-picker';
import {connect} from 'react-redux';
import {getStyles} from './style';
import {addNotification as addNotificationAction} from './redux/actions';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import {Toast} from 'react-native-toast-notifications';
import {useImages} from '../../Utils/Images';
import moment from 'moment';
// FIREBASE COMMENTED OUT - Backend functionality disabled
// import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';
import {energyMatchRequest} from '../../Utils/energyMatchClient';
import {buildTranscriptPayloadFromFirebaseMessages} from '../../Utils/energyMatchTranscript';
import {recoverEnergyMatchTokenSilently} from '../../Utils/energyMatchSession';
import {inferVibeAndDjangoMoodFromReflection} from '../../Utils/energyMatchMoodInference';
import EnergyMatchModal from '../../Components/EnergyMatchModal';
import MessageTicks from '../../Components/MessageTicks';
import {
  getDmReadStatus,
  incrementPeerUnread,
  markChatAsRead,
} from '../../Utils/readReceipts';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

const Chat = ({route, theme, addNotificationAction, userDetail}) => {
  const isFocused = useIsFocused();
  const AUTO_REFLECTION_THROTTLE_MS = 15000;
  const ENERGY_TOKEN_TOAST_THROTTLE_MS = 30000;
  const [inputValue, setInputValue] = useState('');
  const [preview, setPreview] = useState(false);
  const [assets, setAssets] = useState([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [energyModal, setEnergyModal] = useState(null);
  const [energyBusy, setEnergyBusy] = useState(false);
  const [energyMatches, setEnergyMatches] = useState(null);
  const [energyReflections, setEnergyReflections] = useState(null);
  const [chatBlocked, setChatBlocked] = useState(false);
  const [blockReasonText, setBlockReasonText] = useState('');
  const myBlockedRef = useRef({});
  const blockedByRef = useRef({});
  const [state, setState] = useState({
    listHeight: 0,
    scrollViewHeight: 0,
    uploading: false,
    messages: [],
    messageText: '',
    messageData: null,
  });
  const autoReflectionInFlightRef = useRef(false);
  const lastAutoReflectionAtRef = useRef(0);
  const lastEnergyTokenToastAtRef = useRef(0);
  const {images} = useImages();
  const navigation = useNavigation();
  const styles = getStyles(theme);
  const {messageData} = state;

  const {messageuid} = route?.params || {};
  const peer = useMemo(
    () => getPeerFromRouteData(route?.params?.data, userDetail?.id),
    [route?.params?.data, userDetail?.id],
  );

  const handleChange = (key, value) => {
    setState(pre => ({...pre, [key]: value}));
  };

  const openCamera = () => {
    // FIREBASE COMMENTED OUT - Backend functionality disabled
    // Image upload to Firebase Storage disabled
    ImageCropPicker.openCamera({
      width: 300,
      height: 400,
      cropping: true,
    })
      .then(async response => {
        if (!response.path) {
          handleChange('uploading', false);
        } else {
          // FIREBASE COMMENTED OUT - Firebase Storage disabled
          // const uri = response.path;
          // const filename = Date.now();
          // const uploadUri =
          //   Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
          // const task = storage()
          //   .ref('Chat/' + filename)
          //   .putFile(uploadUri);
          // // set progress state
          // task.on('state_changed', snapshot => {});
          // try {
          //   const durl = await task;
          //   task.snapshot.ref.getDownloadURL().then(downloadURL => {
          //     handleSendMessage(downloadURL, 'image');
          //   });
          // } catch (e) {
          //   console.error(e);
          // }
          // Use local URI instead for UI testing
          handleSendMessage(response.path, 'image');
          handleChange('uploading', false);
        }
      })
      .catch(err => {
        handleChange('showAlert', false);
        handleChange('uploading', false);
      });
  };

  const openGallery = () => {
    // FIREBASE COMMENTED OUT - Backend functionality disabled
    // Image upload to Firebase Storage disabled
    ImageCropPicker.openPicker({
      mediaType: 'video',
      width: 300,
      height: 400,
      cropping: true,
    })
      .then(async response => {
        if (!response.path) {
          handleChange('uploading', false);
        } else {
          // FIREBASE COMMENTED OUT - Firebase Storage disabled
          // const uri = response.path;
          // const filename = Date.now();
          // const uploadUri =
          //   Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
          // const task = storage()
          //   .ref('Chat/' + filename)
          //   .putFile(uploadUri);
          // task.on('state_changed', snapshot => {});
          // try {
          //   await task;
          //   task.snapshot.ref.getDownloadURL().then(downloadURL => {
          //     handleSendMessage(downloadURL, 'image');
          //   });
          // } catch (e) {
          //   console.error(e);
          // }
          // Use local URI instead for UI testing
          handleSendMessage(response.path, 'image');
          handleChange('uploading', false);
        }
      })
      .catch(err => {
        handleChange('showAlert', false);
        handleChange('uploading', false);
      });
  };

  // const openVideo = async () => {
  //   await launchImageLibrary({
  //     mediaType: 'video',
  //     width: 300,
  //     height: 400,
  //     durationLimit: 20,
  //   })
  //     .then(async response => {
  //       if (!response) {
  //         console.log('response', response?.assets[0]);
  //         return handleChange('uploading', false);
  //       }
  //       console.log(response, 'response');
  //       const uri = response?.assets[0]?.uri;
  //       const filename = Date.now();
  //       const uploadUri =
  //         Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
  //       const task = storage()
  //         .ref('Chat/' + filename)
  //         .putFile(uploadUri);

  //       task.on('state_changed', snapshot => {});
  //       try {
  //         await task;
  //         const downloadURL = await task.snapshot.ref.getDownloadURL();
  //         handleSendMessage(downloadURL, 'video');
  //       } catch (e) {
  //         console.error(e);
  //       } finally {
  //         handleChange('uploading', false);
  //       }
  //     })
  //     .catch(err => {
  //       console.error(err);
  //       handleChange('showAlert', false);
  //       handleChange('uploading', false);
  //     });
  // };

  const toggleAnimation = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLinkOpen(!linkOpen);
  };

  let scrollView;
  const downButtonHandler = () => {
    if (scrollView !== null) {
      scrollView.scrollToEnd !== null &&
        scrollView.scrollToEnd({animated: true});
    }
  };
  useEffect(() => {
    if (scrollView !== null) {
      downButtonHandler();
    }
  });

  const handleSendMessage = async (text, type) => {
    try {
      setLinkOpen(false);
      if (chatBlocked) {
        Toast.show(blockReasonText || "You can't message this user");
        return;
      }
      const trimmedInputValue = inputValue.trim();
      if (!trimmedInputValue && !text) {
        return;
      }
      if (!messageuid) {
        Toast.show('Missing chat');
        return;
      }
      const roomRef = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
      const snap = await roomRef.once('value');
      let val = snap.val() || {};
      const routePeer = getPeerFromRouteData(route?.params?.data, userDetail?.id);

      const metaPatch = {};
      if (
        userDetail?.id &&
        routePeer?.id &&
        String(routePeer.id) !== String(userDetail.id) &&
        (val.senderId == null || val.receiverId == null)
      ) {
        metaPatch.sender = toChatProfile(userDetail);
        metaPatch.receiver = toChatProfile(routePeer);
        metaPatch.senderId = userDetail.id;
        metaPatch.receiverId = routePeer.id;
        metaPatch.id = messageuid;
      }

      const prevMsgs = Array.isArray(val.messages) ? val.messages : [];
      const data = {
        text: trimmedInputValue || text,
        timeStamp: Date.now(),
        type: type || 'text',
        senderId: userDetail?.id,
      };
      const updatedMessages = [...prevMsgs, data];
      const mergedMeta = {...val, ...metaPatch};
      const updatedValues = {
        ...metaPatch,
        messages: updatedMessages,
        ...incrementPeerUnread(mergedMeta, userDetail?.id),
        timeStamp: Date.now(),
      };

      setState(prevState => ({...prevState, loading: true}));
      await roomRef.update(updatedValues);
      const merged = {...val, ...updatedValues};
      setState(prevState => ({
        ...prevState,
        loading: false,
        messageText: '',
        messages: updatedMessages,
        messageData: merged,
      }));
      runAutoReflectionAfterSend(updatedMessages, data.type);
      setInputValue('');
      downButtonHandler();
    } catch (err) {
      console.error(err);
      Toast.show('Something went wrong!', Toast.LONG);
      setState(prevState => ({...prevState, loading: false}));
    }
  };

  const sendNotification = async notificationData => {
    try {
      await addNotificationAction(notificationData);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const deleteMessage = async messageIndex => {
    try {
      const ref = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
      const snap = await ref.once('value');
      const val = snap.val() || {};
      const arr = [...(val.messages || [])];
      arr.splice(messageIndex, 1);
      await ref.update({messages: arr});
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleConfirmDelete = id => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [{text: 'Cancel'}, {text: 'Yes', onPress: () => deleteMessage(id)}],
    );
  };

  const syncInferredMoodFromReflection = async reflectionData => {
    if (!messageuid || !userDetail?.id || !reflectionData) {
      return;
    }
    const {vibe, djangoMood} =
      inferVibeAndDjangoMoodFromReflection(reflectionData);
    const patch = await energyMatchRequest('/accounts/me/', {
      method: 'PATCH',
      body: {mood: djangoMood},
    });
    if (!patch.ok && __DEV__) {
      console.warn('[EnergyMatch] mood PATCH failed', patch.error);
    }
    try {
      await database()
        .ref(
          `${RTDB_MESSAGES_PATH}/${messageuid}/energyMoods/${userDetail.id}`,
        )
        .set({
          vibe,
          mood: djangoMood,
          updatedAt: Date.now(),
        });
    } catch (e) {
      if (__DEV__) {
        console.warn('[EnergyMatch] RTDB energyMoods write failed', e);
      }
    }
  };

  const handleMissingEnergyToken = async context => {
    const now = Date.now();
    if (
      now - lastEnergyTokenToastAtRef.current >
      ENERGY_TOKEN_TOAST_THROTTLE_MS
    ) {
      lastEnergyTokenToastAtRef.current = now;
      Toast.show(
        'Energy Match is reconnecting in the background. Please retry in a few seconds.',
        Toast.LONG,
      );
    }
    const recovered = await recoverEnergyMatchTokenSilently({retryOnce: true});
    if (!recovered.ok && __DEV__) {
      console.warn('[EnergyMatch] silent token recovery failed:', context, recovered.error);
    }
    return recovered;
  };

  const runAutoReflectionAfterSend = async (messages, sentType) => {
    if (sentType && sentType !== 'text') {
      return;
    }
    const now = Date.now();
    if (
      autoReflectionInFlightRef.current ||
      now - lastAutoReflectionAtRef.current < AUTO_REFLECTION_THROTTLE_MS
    ) {
      return;
    }
    const payload = buildTranscriptPayloadFromFirebaseMessages(
      messages,
      userDetail,
      peer,
      undefined,
    );
    if (!payload.messages.length) {
      return;
    }
    autoReflectionInFlightRef.current = true;
    lastAutoReflectionAtRef.current = now;
    try {
      const r = await energyMatchRequest('/reflections/from-transcript/', {
        method: 'POST',
        body: payload,
      });
      if (!r.ok && r.error === 'NO_ENERGY_MATCH_TOKEN') {
        await handleMissingEnergyToken('auto_reflection');
      } else if (!r.ok && __DEV__) {
        console.warn('[EnergyMatch] auto reflection failed:', r.error);
      } else if (r.ok && r.data) {
        await syncInferredMoodFromReflection(r.data);
        if (energyModal === 'reflections') {
          await refreshReflectionsList();
        }
      }
    } finally {
      autoReflectionInFlightRef.current = false;
    }
  };

  const openChatSafetyMenu = () => {
    if (!peer?.id) {
      return;
    }
    showChatSafetyMenu({
      onReport: () => {
        promptReportReason(async reason => {
          const blockerUid = auth().currentUser?.uid;
          if (!blockerUid) {
            Toast.show('Sign in required');
            return;
          }
          const r = await submitRtdbReport({
            reportedUserId: peer.id,
            reason,
          });
          if (r.ok) {
            Toast.show('Report submitted');
          } else {
            Toast.show(r.error || 'Could not submit report');
          }
        });
      },
      onBlock: () => {
        Alert.alert(
          'Block this user?',
          'You will not see this chat in your list.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                const blockerUid = auth().currentUser?.uid;
                if (!blockerUid || !peer?.id) {
                  return;
                }
                const res = await blockRtdbTarget({
                  blockerId: blockerUid,
                  blockedKey: peer.id,
                });
                if (res.ok) {
                  Toast.show('Blocked');
                  navigation.goBack();
                } else {
                  Toast.show(res.error || 'Could not block');
                }
              },
            },
          ],
        );
      },
    });
  };

  const openEnergyMenu = () => {
    setEnergyMatches(null);
    setEnergyReflections(null);
    setEnergyModal('menu');
  };

  const openMatchesPanel = async () => {
    setEnergyModal('matches');
    setEnergyBusy(true);
    setEnergyMatches(null);
    const r = await energyMatchRequest('/matches/?limit=8');
    setEnergyBusy(false);
    if (!r.ok) {
      if (r.error === 'NO_ENERGY_MATCH_TOKEN') {
        await handleMissingEnergyToken('open_matches');
      } else {
        Toast.show(String(r.error), Toast.LONG);
      }
      setEnergyMatches({count: 0, results: []});
      return;
    }
    setEnergyMatches(r.data);
  };

  const openReflectionsPanel = async () => {
    setEnergyModal('reflections');
    setEnergyBusy(true);
    setEnergyReflections(null);
    const r = await energyMatchRequest('/reflections/');
    setEnergyBusy(false);
    if (!r.ok) {
      if (r.error === 'NO_ENERGY_MATCH_TOKEN') {
        await handleMissingEnergyToken('open_reflections');
      } else {
        Toast.show(String(r.error), Toast.LONG);
      }
      setEnergyReflections([]);
      return;
    }
    const data = r.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
    setEnergyReflections(list);
  };

  const refreshReflectionsList = async () => {
    setEnergyBusy(true);
    const r = await energyMatchRequest('/reflections/');
    setEnergyBusy(false);
    if (r.ok) {
      const data = r.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setEnergyReflections(list);
    }
  };

  const onGenerateReflection = async () => {
    const payload = buildTranscriptPayloadFromFirebaseMessages(
      state.messages,
      userDetail,
      peer,
      undefined,
    );
    if (!payload.messages.length) {
      Toast.show('No text messages in this chat to analyze yet.');
      return;
    }
    setEnergyBusy(true);
    const r = await energyMatchRequest('/reflections/from-transcript/', {
      method: 'POST',
      body: payload,
    });
    setEnergyBusy(false);
    if (!r.ok) {
      if (r.error === 'NO_ENERGY_MATCH_TOKEN') {
        await handleMissingEnergyToken('manual_reflection');
      } else {
        Toast.show(String(r.error), Toast.LONG);
      }
      return;
    }
    Toast.show('Reflection saved');
    if (r.data) {
      await syncInferredMoodFromReflection(r.data);
    }
    await refreshReflectionsList();
  };

  const getProfileImage = () => {
    const isSender = messageData?.senderId === userDetail?.id;
    const profileImage = isSender
      ? messageData?.receiver?.profile_image
      : messageData?.sender?.profile_image;
    if (profileImage && typeof profileImage === 'string') {
      return {uri: profileImage};
    }
    if (peer?.profile_image && typeof peer.profile_image === 'string') {
      return {uri: peer.profile_image};
    }
    return images.profile;
  };

  const imageList = assets?.map(({uri, image}) => ({
    url: uri ? uri : image,
  }));
  useEffect(() => {
    if (!userDetail?.id || !messageuid) {
      return undefined;
    }
    const routePeer = getPeerFromRouteData(route?.params?.data, userDetail.id);
    if (
      routePeer?.id &&
      String(routePeer.id) !== String(userDetail.id)
    ) {
      const roomRef = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
      let cancelled = false;
      (async () => {
        try {
          const snap = await roomRef.once('value');
          if (cancelled || snap.val() != null) {
            return;
          }
          await roomRef.update({
            sender: toChatProfile(userDetail),
            receiver: toChatProfile(routePeer),
            senderId: userDetail.id,
            receiverId: routePeer.id,
            id: messageuid,
            timeStamp: Date.now(),
            receiverRead: 0,
            senderRead: 0,
            readAt: {},
            messages: [],
          });
        } catch (e) {
          console.error('Chat seed room failed', e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [userDetail?.id, messageuid, route?.params?.data]);

  useEffect(() => {
    if (!userDetail?.id || !messageuid) {
      return undefined;
    }
    const roomRef = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
    const onVal = snapshot => {
      if (snapshot.val()) {
        const v = snapshot.val();
        setState(prev => ({
          ...prev,
          messages: Array.isArray(v.messages) ? v.messages : [],
          messageData: v,
        }));
      } else {
        setState(prev => ({
          ...prev,
          messages: [],
          messageData: null,
        }));
      }
    };
    roomRef.on('value', onVal);
    return () => roomRef.off('value', onVal);
  }, [userDetail?.id, messageuid]);

  useEffect(() => {
    if (!userDetail?.id || !peer?.id) {
      setChatBlocked(false);
      setBlockReasonText('');
      return undefined;
    }
    const myId = String(userDetail.id);
    const peerId = String(peer.id);
    const recompute = () => {
      const reason = dmBlockReason(
        myId,
        peerId,
        myBlockedRef.current,
        blockedByRef.current,
      );
      setChatBlocked(Boolean(reason));
      setBlockReasonText(reason || '');
    };
    const blocksRef = database().ref(`Blocks/${myId}/blocked`);
    const blockedByDbRef = database().ref(`BlockedBy/${myId}/by`);
    const onBlocks = snapshot => {
      myBlockedRef.current = snapshot.val() || {};
      recompute();
    };
    const onBlockedBy = snapshot => {
      blockedByRef.current = snapshot.val() || {};
      recompute();
    };
    blocksRef.on('value', onBlocks);
    blockedByDbRef.on('value', onBlockedBy);
    return () => {
      blocksRef.off('value', onBlocks);
      blockedByDbRef.off('value', onBlockedBy);
    };
  }, [userDetail?.id, peer?.id]);

  useEffect(() => {
    if (!isFocused || !userDetail?.id || !messageuid || chatBlocked) {
      return undefined;
    }
    markChatAsRead(messageuid, userDetail.id).catch(e => {
      if (__DEV__) {
        console.warn('[Chat] markChatAsRead failed', e);
      }
    });
    return undefined;
  }, [isFocused, userDetail?.id, messageuid, chatBlocked]);

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const textOnButton = useThemeColor('textOnButton');
  const inputBackground = useThemeColor('inputBackground');
  const bubbleReceived = useThemeColor('bubbleReceived');
  const bubbleSent = useThemeColor('bubbleSent');
  const buttonColor = useThemeColor('buttonColor');
  const borderColor = useThemeColor('border');
  const placeholderColor = useThemeColor('placeholder');

  return (
    <>
      <SafeAreaView
        style={[styles.container, {backgroundColor: backgroundColor}]}>
        <View style={[styles.header, {backgroundColor: headerBackgroundColor, borderBottomColor: borderColor}]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons size={25} color={headerTextColor} name={'arrow-back'} />
          </TouchableOpacity>
          <Pressable
            onPress={() => {
              if (messageuid && (peer?.id || messageData)) {
                navigation.navigate('ChatInfo', {
                  messageuid,
                  kind: 'dm',
                });
              }
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View style={styles.imageDiv}>
              <View
                style={[
                  styles.imageContainer,
                  {backgroundColor: buttonColor},
                ]}>
                <Image
                  source={
                    (() => {
                      const profileImg = getProfileImage();
                      if (
                        profileImg &&
                        profileImg.uri &&
                        typeof profileImg.uri === 'string'
                      ) {
                        return profileImg;
                      }
                      return images.profile;
                    })()
                  }
                  style={{
                    width: 37,
                    height: 36,
                    borderRadius: 30,
                  }}
                />
              </View>
              <Text style={styles.userName}>
                {messageData
                  ? messageData?.senderId === userDetail?.id
                    ? messageData?.receiver?.name
                    : messageData?.sender?.name
                  : peer?.name ?? ''}
              </Text>
            </View>
          </Pressable>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {peer?.id ? (
              <TouchableOpacity
                onPress={openChatSafetyMenu}
                style={{marginRight: 12}}
                accessibilityLabel="Chat options">
                <Ionicons name="ellipsis-vertical" size={22} color={headerTextColor} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={openEnergyMenu}
              accessibilityLabel="Energy Match menu">
              <Ionicons size={24} color={headerTextColor} name="flash-outline" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={state?.messages}
          keyboardDismissMode="on-drag"
          style={{flex: 1}}
          contentContainerStyle={{
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
          }}
          onContentSizeChange={(contentWidth, contentHeight) => {
            setState(prevState => ({
              ...prevState,
              listHeight: contentHeight,
            }));
          }}
          onLayout={e => {
            const height = e.nativeEvent.layout.height;
            setState(prevState => ({
              ...prevState,
              scrollViewHeight: height,
            }));
          }}
          ref={ref => {
            scrollView = ref;
          }}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index?.toString()}
          renderItem={({item, index}) => {
            if (item == null) {
              return <View />;
            } else if (item?.senderId !== userDetail?.id) {
              return (
                <View
                  key={index}
                  style={{
                    width: '100%',
                    marginVertical: 10,
                  }}>
                  <View
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      paddingBottom: 10,
                      marginHorizontal: 10,
                    }}>
                    <Image
                      style={{
                        width: 40,
                        borderRadius: 20,
                        height: 40,
                        marginRight: 10,
                      }}
                      resizeMode="cover"
                      source={(() => {
                        const fromRoom =
                          messageData?.senderId === userDetail?.id
                            ? messageData?.receiver?.profile_image
                            : messageData?.sender?.profile_image;
                        if (
                          fromRoom &&
                          typeof fromRoom === 'string'
                        ) {
                          return {uri: fromRoom};
                        }
                        if (
                          peer?.profile_image &&
                          typeof peer.profile_image === 'string'
                        ) {
                          return {uri: peer.profile_image};
                        }
                        return images.profile;
                      })()}
                    />

                    {item?.type === 'image' ? (
                      <View
                        style={{
                          borderRadius: 10,
                          padding: 5,
                          backgroundColor: bubbleReceived,
                        }}>
                        <Image
                          source={{uri: item?.text}}
                          style={{
                            width: 250,
                            height: 200,
                            resizeMode: 'contain',
                          }}
                        />
                      </View>
                    ) : (
                      //  item?.type == 'video' ? (
                      //   <View
                      //     style={{
                      //       backgroundColor: headerBackgroundColor,
                      //       maxWidth: '90%',
                      //       borderRadius: 10,
                      //       paddingLeft: 10,
                      //       paddingHorizontal: 30,
                      //     }}>
                      //     <View
                      //       style={{
                      //         width: '130%',
                      //         alignItems: 'flex-end',
                      //         marginTop: 10,
                      //       }}>
                      //       <Text
                      //         style={{
                      //           color: 'white',
                      //           fontSize: 10,
                      //           marginHorizontal: 5,
                      //           marginTop: -5,
                      //         }}>
                      //         {moment(item?.timeStamp).format('h:mm a')}
                      //       </Text>
                      //     </View>
                      //   </View>
                      // ) :
                      <View
                        style={{
                          backgroundColor: bubbleReceived,
                          maxWidth: '80%',
                          borderRadius: 10,
                          paddingLeft: 10,
                          paddingHorizontal: 30,
                        }}>
                        <Text
                          style={{
                          textAlign: 'left',
                          color: textColor,
                        }}>
                          {item?.text}
                        </Text>

                        <View
                          style={{
                            alignItems: 'flex-end',
                            marginTop: 10,
                          }}>
                          <Text
                            style={{
                              color: textSecondary,
                              fontSize: 10,
                              marginHorizontal: 5,
                              marginBottom: 5,
                              left: 20,
                            }}>
                            {moment(item?.timeStamp).format('h:mm a')}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            } else {
              return (
                <Pressable
                  onLongPress={() => handleConfirmDelete(index)}
                  key={index}
                  style={styles.sentTextHeader}>
                  <View
                    style={{
                      width: '95%',
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-end',
                      paddingBottom: 10,
                    }}>
                    {item?.type === 'image' ? (
                      <Pressable
                        onPress={
                          (() => setAssets([item?.text]), setPreview(true))
                        }
                        style={{
                          borderRadius: 10,
                          padding: 5,
                          backgroundColor: inputBackground,
                        }}>
                        <Image
                          source={{uri: item?.text}}
                          style={{
                            width: 250,
                            height: 200,
                            resizeMode: 'contain',
                          }}
                        />
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            marginTop: 4,
                            gap: 4,
                          }}>
                          <Text
                            style={{
                              color: textSecondary,
                              fontSize: 10,
                            }}>
                            {moment(item?.timeStamp).format('h:mm a')}
                          </Text>
                          <MessageTicks
                            status={getDmReadStatus(
                              item,
                              messageData,
                              userDetail?.id,
                            )}
                          />
                        </View>
                      </Pressable>
                    ) : (
                      <View
                        style={{
                          backgroundColor: bubbleSent,
                          maxWidth: '85%',
                          alignItems: 'flex-end',
                          borderRadius: 16,
                          borderBottomRightRadius: 4,
                          padding: 12,
                        }}>
                        <Text style={{color: textColor}}>{item?.text}</Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 7,
                            gap: 4,
                          }}>
                          <Text
                            style={{
                              color: textSecondary,
                              fontSize: 10,
                            }}>
                            {moment(item?.timeStamp).format('h:mm a')}
                          </Text>
                          <MessageTicks
                            status={getDmReadStatus(
                              item,
                              messageData,
                              userDetail?.id,
                            )}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }
          }}
        />

        {linkOpen && (
          <View
            style={[
              styles.inputInnerContainer,
              {
                height: 100,
                justifyContent: 'space-evenly',
                marginHorizontal: 20,
                backgroundColor: inputBackground,
              },
            ]}>
            {/* <TouchableOpacity
              style={{
                backgroundColor: 'purple',
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 25,
              }}
              onPress={openVideo}>
              <Ionicons size={25} color={'white'} name={'videocam'} />
            </TouchableOpacity> */}

            <TouchableOpacity
              style={{
                backgroundColor: buttonColor,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 24,
              }}
              onPress={openGallery}>
              <MaterialIcons size={22} color={textOnButton} name={'insert-photo'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: textColor,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 24,
              }}
              onPress={openCamera}>
              <MaterialIcons size={22} color={textOnButton} name={'add-a-photo'} />
            </TouchableOpacity>
          </View>
        )}

        {chatBlocked ? (
          <View
            style={{
              marginHorizontal: 12,
              marginBottom: 8,
              padding: 12,
              borderRadius: 8,
              backgroundColor: inputBackground,
              borderWidth: 1,
              borderColor,
            }}>
            <Text style={{color: textSecondary, fontSize: 14, textAlign: 'center'}}>
              {blockReasonText}
            </Text>
          </View>
        ) : null}

        <View style={{flexDirection: 'row'}}>
          <View
            style={[
              styles.inputInnerContainer,
              {backgroundColor: inputBackground, borderColor},
            ]}>
            <View style={styles.leftInputView}>
              <TextInput
                placeholderTextColor={placeholderColor}
                placeholder="Type here..."
                style={[styles.inputText, {color: textColor}]}
                value={inputValue}
                onChangeText={setInputValue}
                editable={!chatBlocked}
              />
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={toggleAnimation} disabled={chatBlocked}>
                <Entypo size={25} color={textColor} name={'link'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openCamera} disabled={chatBlocked}>
                <Entypo size={25} color={textColor} name={'camera'} />
              </TouchableOpacity>
            </View>
          </View>
          <Pressable
            style={[
              styles.sendBtn,
              {
                backgroundColor: buttonColor,
                opacity: chatBlocked ? 0.5 : 1,
              },
            ]}
            disabled={chatBlocked}
            onPress={() => handleSendMessage()}>
            <MaterialCommunityIcons size={22} color={textOnButton} name={'send'} />
          </Pressable>
        </View>
      </SafeAreaView>

      <EnergyMatchModal
        visible={energyModal != null}
        panel={energyModal}
        onClose={() => !energyBusy && setEnergyModal(null)}
        onBackToMenu={() => !energyBusy && setEnergyModal('menu')}
        energyBusy={energyBusy}
        colors={{
          inputBackground,
          textColor,
          placeholderColor,
          headerBackgroundColor,
        }}
        energyMatches={energyMatches}
        energyReflections={energyReflections}
        openMatchesPanel={openMatchesPanel}
        openReflectionsPanel={openReflectionsPanel}
        onGenerateReflection={onGenerateReflection}
      />
    </>
  );
};

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
  userDetail: state?.login?.userDetail?.user,
});

const mapDispatchToProps = dispatch => ({
  addNotificationAction: data => dispatch(addNotificationAction(data)),
});
export default connect(mapStateToProps, mapDispatchToProps)(Chat);
