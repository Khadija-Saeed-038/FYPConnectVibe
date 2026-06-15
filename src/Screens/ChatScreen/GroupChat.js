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
  Modal,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {RTDB_MESSAGES_PATH} from '../../Config/firebase';
import {blockRtdbTarget, submitRtdbReport} from '../../Utils/safetyActions';
import {showGroupChatMenu, promptReportReason} from '../../Utils/safetyMenu';

import ImageCropPicker from 'react-native-image-crop-picker';
import {connect} from 'react-redux';
import {getStyles} from './style';
import {addNotification as addNotificationAction} from './redux/actions';
import {useThemeColor} from '../ThemeProvider/redux/saga';
// import {pick, types} from 'react-native-document-picker';
import {Toast} from 'react-native-toast-notifications';
import {useEffect} from 'react';
import {useImages} from '../../Utils/Images';
import moment from 'moment';
import {energyMatchRequest} from '../../Utils/energyMatchClient';
import {buildTranscriptPayloadFromFirebaseMessages} from '../../Utils/energyMatchTranscript';
import {inferVibeAndDjangoMoodFromReflection} from '../../Utils/energyMatchMoodInference';
import {isGroupMember} from '../../Utils/groupMembers';
import {
  canMarkGroupRead,
  getGroupReadStatus,
  markChatAsRead,
} from '../../Utils/readReceipts';
import MessageTicks from '../../Components/MessageTicks';
import EnergyMatchModal from '../../Components/EnergyMatchModal';
// FIREBASE COMMENTED OUT - Backend functionality disabled
// import storage from '@react-native-firebase/storage';
import ImageViewer from 'react-native-image-zoom-viewer';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

function getParticipantById(messageData, senderId) {
  const sid = String(senderId ?? '');
  const list = messageData?.participents;
  if (!Array.isArray(list)) {
    return null;
  }
  return list.find(e => String(e?.id) === sid) ?? null;
}

function getSenderDisplayName(messageData, senderId) {
  const p = getParticipantById(messageData, senderId);
  const name = p ? String(p.name || '').trim() : '';
  const sid = senderId != null ? String(senderId) : '';
  return name || (sid ? `User ${sid.slice(-4)}` : 'User');
}

const GroupChat = ({route, theme, addNotificationAction, userDetail}) => {
  const isFocused = useIsFocused();
  const [inputValue, setInputValue] = useState('');
  const [preview, setPreview] = useState(false);
  const [assets, setAssets] = useState([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [energyModal, setEnergyModal] = useState(null);
  const [energyBusy, setEnergyBusy] = useState(false);
  const [energyMatches, setEnergyMatches] = useState(null);
  const [energyReflections, setEnergyReflections] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [removedFromGroup, setRemovedFromGroup] = useState(false);
  const [state, setState] = useState({
    listHeight: 0,
    scrollViewHeight: 0,
    uploading: false,
    messages: [],
    messageText: '',
    messageData: null,
  });
  const {images} = useImages();
  const navigation = useNavigation();
  const styles = getStyles(theme);
  const {messageData} = state;

  const {messageuid} = route?.params;

  const handleChange = (key, value) => {
    setState(pre => ({...pre, [key]: value}));
  };

  const openCamera = () => {
    if (removedFromGroup) {
      Toast.show('You were removed from this group');
      return;
    }
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
    if (removedFromGroup) {
      Toast.show('You were removed from this group');
      return;
    }
    // FIREBASE COMMENTED OUT - Backend functionality disabled
    // Image upload to Firebase Storage disabled
    ImageCropPicker.openPicker({
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

  // const openDocument = async () => {
  //   pick({
  //     type: [types.pdf, types.docx],
  //   })
  //     .then(async response => {
  //       const uri = response[0].uri;
  //       const filename = response[0].name;
  //       const uploadUri =
  //         Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
  //       const task = storage()
  //         .ref('Chat/' + filename)
  //         .putFile(uploadUri);
  //       task.on('state_changed', snapshot => {});
  //       try {
  //         await task;
  //         task.snapshot.ref.getDownloadURL().then(downloadURL => {
  //           handleSendMessage(downloadURL, 'document');
  //         });
  //       } catch (e) {
  //         console.error(e);
  //       }
  //       handleChange('uploading', false);
  //     })
  //     .catch(err => {
  //       handleChange('showAlert', false);
  //       handleChange('uploading', false);
  //     });
  // };

  const toggleAnimation = () => {
    if (removedFromGroup) {
      return;
    }
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
    setLinkOpen(false);
    if (removedFromGroup) {
      Toast.show('You were removed from this group');
      return;
    }
    if (inputValue.trim() || text) {
      const data = {
        text: inputValue || text,
        timeStamp: Date.now(),
        type: type || 'text',
        senderId: userDetail?.id,
      };
      const prevMsgs =
        state.messageData?.messages || state.messages || [];
      const messages = [...prevMsgs, data];
      const values = {
        messages,
        timeStamp: Date.now(),
      };
      try {
        await database()
          .ref(`${RTDB_MESSAGES_PATH}/${messageuid}`)
          .update(values);
        setState(prevState => ({
          ...prevState,
          loading: false,
          messageText: '',
          messages,
        }));
        downButtonHandler();
        setInputValue('');
      } catch (err) {
        Toast.show('Something went wrong!', Toast.LONG);
      }
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
      'Unsend Message',
      'Are you sure you want to unsend this message?',
      [{text: 'Cancel'}, {text: 'Yes', onPress: () => deleteMessage(id)}],
    );
  };

  const getProfileImage = () => {
    const isSender = messageData?.senderId === userDetail?.id;
    const profileImage = isSender
      ? messageData?.receiver?.profile_image
      : messageData?.sender?.profile_image;

    // Ensure profileImage is a valid string before creating uri object
    return (profileImage && typeof profileImage === 'string') ? {uri: profileImage} : images.profile;
  };
  const imageList = assets?.map(({uri, image}) => ({
    url: uri ? uri : image,
  }));

  useEffect(() => {
    if (!userDetail || !messageuid) {
      return undefined;
    }
    const roomRef = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
    const onVal = snapshot => {
      if (snapshot.val()) {
        const v = snapshot.val();
        const active = isGroupMember(v, userDetail?.id);
        setRemovedFromGroup(!active);
        setState(prev => ({
          ...prev,
          messages: v.messages || [],
          messageData: v,
        }));
      } else {
        setRemovedFromGroup(false);
        setState(prev => ({
          ...prev,
          messages: [],
          messageData: null,
        }));
      }
    };
    roomRef.on('value', onVal);
    return () => roomRef.off('value', onVal);
  }, [userDetail, messageuid]);

  useEffect(() => {
    if (
      !isFocused ||
      !userDetail?.id ||
      !messageuid ||
      removedFromGroup
    ) {
      return undefined;
    }
    if (messageData && !canMarkGroupRead(messageData, userDetail.id)) {
      return undefined;
    }
    markChatAsRead(messageuid, userDetail.id).catch(e => {
      if (__DEV__) {
        console.warn('[GroupChat] markChatAsRead failed', e);
      }
    });
    return undefined;
  }, [
    isFocused,
    userDetail?.id,
    messageuid,
    removedFromGroup,
    messageData,
  ]);

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

  const energyTokenToast = () => {
    Toast.show(
      'Energy Match needs a Django session. Log out and sign in again with email/password while the Energy Match server is running, or set AsyncStorage key "energyMatchToken" manually.',
      Toast.LONG,
    );
  };

  const applyGroupName = async rawText => {
    const t = String(rawText ?? '').trim();
    if (!t) {
      Toast.show('Enter a name');
      return;
    }
    if (!messageuid) {
      return;
    }
    try {
      await database()
        .ref(`${RTDB_MESSAGES_PATH}/${messageuid}/name`)
        .set(t);
      setState(prev => ({
        ...prev,
        messageData: prev.messageData
          ? {...prev.messageData, name: t}
          : prev.messageData,
      }));
      Toast.show('Group renamed');
    } catch (e) {
      Toast.show(String(e?.message || e?.code || 'Could not rename'));
    } finally {
      setRenameModalVisible(false);
    }
  };

  const promptRenameGroup = () => {
    if (!messageuid) {
      return;
    }
    const cur = state.messageData?.name || '';
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename group',
        'New display name',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Save', onPress: text => applyGroupName(text)},
        ],
        'plain-text',
        cur,
      );
    } else {
      setRenameDraft(cur);
      setRenameModalVisible(true);
    }
  };

  const openGroupHeaderMenu = () => {
    if (!messageuid) {
      return;
    }
    showGroupChatMenu({
      onReport: () => {
        promptReportReason(async reason => {
          const blockerUid = auth().currentUser?.uid;
          if (!blockerUid) {
            Toast.show('Sign in required');
            return;
          }
          const reportedUserId = `group:${messageuid}`;
          const r = await submitRtdbReport({
            reportedUserId,
            reason,
            roomId: messageuid,
            kind: 'group',
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
          'Block this group?',
          'You will not see this chat in your list.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                const blockerUid = auth().currentUser?.uid;
                if (!blockerUid || !messageuid) {
                  return;
                }
                const res = await blockRtdbTarget({
                  blockerId: blockerUid,
                  blockedKey: messageuid,
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
      onRename: promptRenameGroup,
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
        energyTokenToast();
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
        energyTokenToast();
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

  const onGenerateReflection = async () => {
    const payload = buildTranscriptPayloadFromFirebaseMessages(
      state.messages,
      userDetail,
      null,
      state.messageData?.participents,
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
        energyTokenToast();
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

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: backgroundColor}]}>
      <View style={[styles.header, {backgroundColor: headerBackgroundColor, borderBottomColor: borderColor}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons size={25} color={headerTextColor} name={'arrow-back'} />
        </TouchableOpacity>
        <Pressable
          onPress={() => {
            if (messageuid) {
              navigation.navigate('ChatInfo', {
                messageuid,
                kind: 'group',
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
              style={[styles.imageContainer, {backgroundColor: buttonColor}]}>
              <Image
                source={
                  messageData?.type == 'group'
                    ? images.groupImage
                    : getProfileImage()
                }
                style={{
                  width: 37,
                  height: 36,
                  borderRadius: 30,
                }}
              />
            </View>
            <Text style={styles.userName}>{messageData?.name || ''}</Text>
          </View>
        </Pressable>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {messageuid ? (
            <TouchableOpacity
              onPress={openGroupHeaderMenu}
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
          // const senderName = findPartcipents(item);
          if (item == null) {
            return <View />;
          } else if (item?.senderId !== userDetail?.id) {
            const messages = state?.messages || [];
            const prev = index > 0 ? messages[index - 1] : null;
            const showSenderHeader =
              item?.senderId != null &&
              (!prev || String(prev?.senderId) !== String(item?.senderId));
            const senderDisplayName = getSenderDisplayName(
              messageData,
              item?.senderId,
            );
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
                    alignItems: 'flex-start',
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
                    source={
                      (() => {
                        if (
                          messageData?.participents?.some(
                            e => e?.id === item?.senderId,
                          )
                        ) {
                          const participant = messageData?.participents?.filter(
                            e => e?.id === item?.senderId,
                          )?.[0];
                          const profileImg = participant?.profile_image;
                          if (profileImg && typeof profileImg === 'string') {
                            return {uri: profileImg};
                          }
                        }
                        return images.profile;
                      })()
                    }
                  />

                  <View style={{maxWidth: '80%', flexShrink: 1}}>
                    {showSenderHeader ? (
                      <Text
                        style={{
                          color: textColor,
                          fontSize: 13,
                          fontWeight: '600',
                          marginBottom: 4,
                        }}>
                        {senderDisplayName}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        maxWidth: '100%',
                        borderRadius: 10,
                        paddingBottom: 5,
                        backgroundColor: bubbleReceived,
                        paddingLeft: 10,
                        paddingHorizontal: 30,
                      }}>
                    {item?.type === 'image' ? (
                      <>
                        <View
                          style={{
                            borderRadius: 10,
                            padding: 5,
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
                      </>
                    ) : (
                      <>
                        <Text
                          style={{
                            textAlign: 'left',
                            color: textColor,
                          }}>
                          {item?.text}
                        </Text>

                        <View
                          style={{
                            width: '130%',
                            alignItems: 'flex-end',
                            marginTop: 10,
                          }}>
                          <Text
                            style={{
                              color: textColor,
                              fontSize: 10,
                              marginHorizontal: 5,
                              marginTop: -5,
                            }}>
                            {moment(item?.timeStamp).format('h:mm a')}
                          </Text>
                        </View>
                        {/* </View> */}
                      </>
                    )}
                  </View>
                </View>
                </View>
              </View>
            );
          } else {
            return (
              <Pressable
                key={index}
                style={styles.sentTextHeader}
                onPress={() => handleConfirmDelete(index)}>
                <View
                  style={{
                    width: '95%',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-end',
                    paddingBottom: 10,
                  }}>
                  {item?.type === 'image' ? (
                    <View
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
                          status={getGroupReadStatus(
                            item,
                            messageData,
                            userDetail?.id,
                          )}
                        />
                      </View>
                    </View>
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
                          marginTop: 6,
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
                          status={getGroupReadStatus(
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

      {removedFromGroup ? (
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: inputBackground,
            borderTopWidth: 1,
            borderTopColor: borderColor,
          }}>
          <Text style={{color: textSecondary, fontSize: 13, textAlign: 'center'}}>
            You were removed from this group
          </Text>
        </View>
      ) : null}

      {linkOpen && !removedFromGroup && (
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
            onPress={openDocument}>
            <Ionicons size={25} color={'white'} name={'document'} />
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

      {!removedFromGroup ? (
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
            />
          </View>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleAnimation}>
              <Entypo size={25} color={textColor} name={'link'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openCamera}>
              <Entypo size={25} color={textColor} name={'camera'} />
            </TouchableOpacity>
          </View>
        </View>
        <Pressable
          style={[styles.sendBtn, {backgroundColor: buttonColor}]}
          onPress={() => (state.messages ? handleSendMessage() : console(''))}>
          <MaterialCommunityIcons size={22} color={textOnButton} name={'send'} />
        </Pressable>
      </View>
      ) : null}

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

      <Modal
        transparent
        visible={renameModalVisible}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}>
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
              padding: 16,
            }}>
            <Text style={{color: textColor, marginBottom: 8, fontWeight: '600'}}>
              Rename group
            </Text>
            <TextInput
              value={renameDraft}
              onChangeText={setRenameDraft}
              placeholder="Group name"
              placeholderTextColor={placeholderColor}
              style={{
                borderWidth: 1,
                borderColor: placeholderColor,
                borderRadius: 8,
                padding: 10,
                color: textColor,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 16,
              }}>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={{marginRight: 16, paddingVertical: 8}}>
                <Text style={{color: textColor}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => applyGroupName(renameDraft)}
                style={{paddingVertical: 8}}>
                <Text style={{color: buttonColor, fontWeight: '600'}}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={preview}>
        <ImageViewer
          imageUrls={imageList}
          onCancel={() => setPreview(false)}
          renderHeader={() => (
            <TouchableOpacity
              onPress={() => setPreview(false)}
              style={{
                marginHorizontal: 10,
                marginVertical: 10,
                marginTop: Platform.OS == 'ios' ? 50 : 0,
                width: 30,
                height: 33,
                justifyContent: 'center',
                alignItems: 'center',
              }}></TouchableOpacity>
          )}
          renderImage={({source}) => (
            <Image
              source={{uri: source.uri}}
              style={{
                bottom: Platform.OS == 'ios' ? 50 : 0,
                width: '100%',
                height: '100%',
              }}
            />
          )}
          backgroundColor="black"
        />
      </Modal>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
  userDetail: state?.login?.userDetail?.user,
});

const mapDispatchToProps = dispatch => ({
  addNotificationAction: data => dispatch(addNotificationAction(data)),
});
export default connect(mapStateToProps, mapDispatchToProps)(GroupChat);
