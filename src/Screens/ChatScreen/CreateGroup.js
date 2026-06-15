import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import database from '@react-native-firebase/database';
import {RTDB_MESSAGES_PATH} from '../../Config/firebase';
import {CommonActions, useIsFocused} from '@react-navigation/native';
import {getUser as getUserAction} from '../NewChat/redux/action';
import {Toast} from 'react-native-toast-notifications';
import {connect} from 'react-redux';
import {useImages} from '../../Utils/Images';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import {getStyles} from './style';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import {signal} from '@preact/signals-react';
import {TextInput as Input} from 'react-native-paper';

const screenHeight = Dimensions.get('window').height;

const CreateGroup = ({
  navigation,
  userDetail,
  theme,
  getUserAction,
  userSearched,
}) => {
  const [state, setState] = useState({
    loading: false,
    loadingCreate: false,
    allEmployee: [],
    participents: [],
    List: [],
    searchText: '',
    groupName: '',
  });

  const {
    loading,
    searchText,
    allEmployee,
    List,
    participents,
    groupName,
    loadingCreate,
  } = state;

  const {images} = useImages();
  const styles = getStyles(theme);
  const isFocused = useIsFocused();
  const users = signal(userSearched);

  const handleChange = (key, value) => {
    setState(pre => ({...pre, [key]: value}));
  };

  const getAllUsers = () => {
    handleChange('loading', true);
    handleChange('allEmployee', users.value);
    handleChange('List', users.value);
    handleChange('loading', false);
  };

  const sortByUser = data => {
    return data?.filter(item => item?.id !== userDetail?.id);
  };
  const filtered = (key, value) => {
    handleChange(key, value);
    if (value) {
      const needle = value.toLowerCase();
      const filteredList = allEmployee?.filter(entry => {
        if (entry?.id === userDetail?.id) {
          return false;
        }
        const name = String(entry?.name || '').toLowerCase();
        const email = String(entry?.email || '').toLowerCase();
        return name.includes(needle) || email.includes(needle);
      });
      handleChange('List', filteredList);
    } else {
      handleChange('List', allEmployee);
    }
  };

  const getParticipentsIDs = () => {
    const lists = [];
    for (let i = 0; i < participents.length; i++) {
      const element = participents[i];
      lists.push(element?.id);
    }
    return lists;
  };

  const createMessageList = () => {
    const nameTrim = String(groupName || '').trim();
    if (!nameTrim) {
      Toast.show('Enter a group name');
      return;
    }
    if (!participents?.length) {
      Toast.show('Add at least one member from the list below');
      return;
    }
    if (!userDetail?.id) {
      Toast.show('You must be signed in to create a group');
      return;
    }
    handleChange('loadingCreate', true);
    const uid = database().ref(RTDB_MESSAGES_PATH).push().key;
    const groupMemberIds = [
      userDetail?.id,
      ...getParticipentsIDs(),
    ].filter(Boolean);
    const memberIds = Object.fromEntries(
      groupMemberIds.map(id => [String(id), true]),
    );
    const value = {
      sender: userDetail,
      senderId: userDetail?.id,
      adminId: userDetail?.id,
      id: uid,
      name: nameTrim,
      type: 'group',
      timeStamp: Date.now(),
      receiverRead: 0,
      senderRead: 0,
      readAt: {},
      participentIds: [userDetail?.id, ...getParticipentsIDs()],
      participents: [{...userDetail}, ...participents],
      memberIds,
      messages: [],
    };
    database()
      .ref(`${RTDB_MESSAGES_PATH}/${uid}`)
      .update(value)
      .then(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              {name: 'BottomBar'},
              {name: 'GroupChat', params: {messageuid: uid}},
            ],
          }),
        );
        handleChange('loadingCreate', false);
      })
      .catch(err => {
        handleChange('loadingCreate', false);
        if (__DEV__) {
          console.warn('[CreateGroup] RTDB write failed', err);
        }
        const code = err?.code || '';
        const msg = String(err?.message || '');
        if (code === 'PERMISSION_DENIED' || /permission/i.test(msg)) {
          Toast.show(
            'Could not save the group. Check Realtime Database rules allow signed-in users to read/write under Messages.',
          );
        } else {
          Toast.show('Something went wrong!');
        }
      });
  };

  const renderSearchInput = () => {
    return (
      <>
        <View
          style={[
            styles.header,
            {backgroundColor: headerBackgroundColor, borderBottomColor: borderColor},
          ]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{justifyContent: 'center', height: 45}}>
            <Ionicons size={25} color={headerTextColor} name={'arrow-back'} />
          </TouchableOpacity>

          <TextInput
            placeholderTextColor={placeholderColor}
            placeholder="Search users"
            style={[
              styles.searchContainer,
              {backgroundColor: searchBar, borderWidth: 1, borderColor},
            ]}
            value={searchText}
            onChangeText={value => filtered('searchText', value)}
          />
        </View>
        <View
          style={{
            marginTop: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Input
            label="Group Name"
            value={groupName}
            onChangeText={value => handleChange('groupName', value)}
            textColor={textColor}
            style={[styles.searchContainer, {backgroundColor: 'transparent',height:60,bottom:5}]}
            activeUnderlineColor={textColor}
            underlineColor={textColor}
          />
          <Text
            style={{
              marginTop: 8,
              marginHorizontal: 12,
              fontSize: 13,
              opacity: 0.75,
              color: textColor,
              textAlign: 'center',
            }}>
            Select people below. You can add as many members as you want.
          </Text>
        </View>
      </>
    );
  };

  useEffect(() => {
    getUserAction('');
  }, [isFocused]);

  useEffect(() => {
    users.value = userSearched;
    getAllUsers();
  }, [userSearched]);

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');
  const buttonColor = useThemeColor('buttonColor');
  const placeholderColor = useThemeColor('placeholder');
  const searchBar = useThemeColor('inputBackground');

  const renderContent = () => {
    return (
      <View style={styles.childContainerStyle}>
        {renderSearchInput()}
        <FlatList
          data={participents}
          horizontal
          style={{width: '100%', paddingLeft: '5%'}}
          showsHorizontalScrollIndicator={false}
          renderItem={({item, index}) => (
            <View
              key={index}
              style={{marginTop: 10, alignItems: 'center', marginRight: 10}}>
              <TouchableOpacity
                onPress={() => {
                  const removed = participents?.filter(e => e?.id !== item?.id);
                  handleChange('participents', removed);
                }}
                style={{
                  width: 20,
                  height: 20,
                  marginRight: -30,
                  marginBottom: -10,
                  zIndex: 33,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: borderColor,
                }}>
                <Entypo name="cross" color="red" size={14} />
              </TouchableOpacity>
              <Image
                source={
                  (item?.profile_image && typeof item?.profile_image === 'string')
                    ? {uri: item?.profile_image}
                    : images.profile
                }
                style={{
                  borderRadius: 5,
                  width: 40,
                  height: 40,
                }}
              />
              <Text
                style={{
                  textAlign: 'center',
                  width: 60,
                  marginTop: 5,
                }}>
                {item?.name}
              </Text>
            </View>
          )}
        />
        <View
          style={{
            width: '90%',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            flexDirection: 'row',
            marginTop: 8,
          }}>
          {loadingCreate && (
            <ActivityIndicator size="small" style={{marginRight: 10}} />
          )}
          <TouchableOpacity
            disabled={
              !String(groupName || '').trim() ||
              !participents?.length ||
              loadingCreate
            }
            onPress={createMessageList}>
            <Text
              style={{
                color: textColor,
                opacity:
                  String(groupName || '').trim() && participents?.length
                    ? 1
                    : 0.45,
              }}>
              Create group
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{width: '90%', marginTop: 10}}></View>
        <Text style={{marginTop: 10, marginHorizontal: 10}}>Suggested</Text>
        {loading && <ActivityIndicator size="small" />}
        <FlatList
          data={sortByUser(List)}
          showsVerticalScrollIndicator={false}
          style={{width: '90%', marginTop: 20, height: screenHeight - 280}}
          renderItem={({item, index}) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                borderBottomWidth: 1,
                paddingBottom: 10,
                borderBottomColor: textColor,
                marginHorizontal: 10,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image
                  source={
                    (item?.profile_image && typeof item?.profile_image === 'string')
                      ? {uri: item?.profile_image}
                      : images.profile
                  }
                  style={{
                    borderRadius: 5,
                    width: 50,
                    height: 50,
                    marginRight: 20,
                  }}
                />
                <Text style={{}}>{item?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (participents?.some(e => e?.id === item?.id)) {
                    const removed = participents?.filter(
                      e => e?.id !== item?.id,
                    );
                    handleChange('participents', removed);
                  } else {
                    handleChange('participents', [...participents, item]);
                  }
                }}>
                <Fontisto
                  color={textColor}
                  size={20}
                  name={
                    participents?.some(e => e?.id === item?.id)
                      ? 'checkbox-active'
                      : 'checkbox-passive'
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: backgroundColor}]}>
      <StatusBar
        animated={true}
        backgroundColor={headerBackgroundColor}
        barStyle={'light-content'}
      />

      {renderContent()}
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
  userSearched: state?.searchUser?.profile,
  loading: state?.searchUser?.requesting,
  userDetail: state?.login?.userDetail?.user,
});

const mapDispatchToProps = dispatch => ({
  getUserAction: data => dispatch(getUserAction(data)),
});
export default connect(mapStateToProps, mapDispatchToProps)(CreateGroup);

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'green',
//   },
//   title: {
//     color: 'white',
//     textAlign: 'center',
//     marginVertical: 10,
//   },
//   sliderContainer: {
//     flexDirection: 'row',
//     width: screenWidth,
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     // backgroundColor: Colors.BUTTON_BG,
//   },
//   touchable: {
//     // borderBottomColor: Colors.WHITE,
//     borderBottomWidth: 2,
//     paddingHorizontal: 30,
//   },
//   childContainerStyle: {
//     paddingVertical: 20,
//     alignItems: 'center',
//   },
//   animatedViewStyle: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     width: screenWidth * 2,
//     flex: 1,
//     marginTop: 2,
//     marginLeft: 0,
//   },
// });
