import React, {useEffect, useMemo, useState} from 'react';
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
import {useIsFocused} from '@react-navigation/native';
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
import {addGroupMembers, isGroupAdmin} from '../../Utils/groupMembers';

const screenHeight = Dimensions.get('window').height;

const AddGroupMembers = ({
  navigation,
  route,
  userDetail,
  theme,
  getUserAction,
  userSearched,
}) => {
  const messageuid = route?.params?.messageuid;
  const [state, setState] = useState({
    loading: false,
    loadingAdd: false,
    allEmployee: [],
    participents: [],
    List: [],
    searchText: '',
    existingMemberIds: [],
    roomLoading: true,
  });

  const {
    loading,
    searchText,
    allEmployee,
    List,
    participents,
    loadingAdd,
    existingMemberIds,
    roomLoading,
  } = state;

  const {images} = useImages();
  const styles = getStyles(theme);
  const isFocused = useIsFocused();
  const users = signal(userSearched);

  const existingSet = useMemo(
    () => new Set(existingMemberIds.map(x => String(x))),
    [existingMemberIds],
  );

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
    return data?.filter(
      item =>
        item?.id !== userDetail?.id && !existingSet.has(String(item?.id)),
    );
  };

  const filtered = (key, value) => {
    handleChange(key, value);
    if (value) {
      const needle = value.toLowerCase();
      const filteredList = allEmployee?.filter(entry => {
        if (entry?.id === userDetail?.id || existingSet.has(String(entry?.id))) {
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

  useEffect(() => {
    if (!messageuid) {
      handleChange('roomLoading', false);
      return undefined;
    }
    const ref = database().ref(`${RTDB_MESSAGES_PATH}/${messageuid}`);
    const onVal = snapshot => {
      const val = snapshot.val();
      if (!val || val.type !== 'group') {
        Toast.show('Group not found');
        navigation.goBack();
        return;
      }
      if (!isGroupAdmin(val, userDetail?.id)) {
        Toast.show('Only the group admin can add members');
        navigation.goBack();
        return;
      }
      const ids = [];
      if (val.memberIds && typeof val.memberIds === 'object') {
        Object.keys(val.memberIds).forEach(k => {
          if (val.memberIds[k] === true) {
            ids.push(String(k));
          }
        });
      }
      if (Array.isArray(val.participentIds)) {
        val.participentIds.forEach(x => {
          if (x != null) {
            ids.push(String(x));
          }
        });
      }
      handleChange('existingMemberIds', [...new Set(ids)]);
      handleChange('roomLoading', false);
    };
    ref.on('value', onVal);
    return () => ref.off('value', onVal);
  }, [messageuid, userDetail?.id, navigation]);

  useEffect(() => {
    getUserAction('');
  }, [isFocused, getUserAction]);

  useEffect(() => {
    users.value = userSearched;
    getAllUsers();
  }, [userSearched]);

  const addMembers = async () => {
    if (!participents?.length) {
      Toast.show('Select at least one user');
      return;
    }
    if (!messageuid) {
      return;
    }
    handleChange('loadingAdd', true);
    try {
      const r = await addGroupMembers(messageuid, participents);
      if (!r.ok) {
        Toast.show(r.error || 'Could not add members');
        return;
      }
      Toast.show(
        r.added === 1 ? 'Member added' : `${r.added} members added`,
      );
      navigation.goBack();
    } catch (e) {
      const code = e?.code || '';
      const msg = String(e?.message || '');
      if (code === 'PERMISSION_DENIED' || /permission/i.test(msg)) {
        Toast.show('Only the group admin can add members');
      } else {
        Toast.show('Something went wrong');
      }
    } finally {
      handleChange('loadingAdd', false);
    }
  };

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');
  const placeholderColor = useThemeColor('placeholder');
  const searchBar = useThemeColor('inputBackground');

  if (roomLoading) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor, justifyContent: 'center'}]}>
        <ActivityIndicator color={textColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: backgroundColor}]}>
      <StatusBar
        animated
        backgroundColor={headerBackgroundColor}
        barStyle="light-content"
      />
      <View style={styles.childContainerStyle}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: headerBackgroundColor,
              borderBottomColor: borderColor,
            },
          ]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{justifyContent: 'center', height: 45}}>
            <Ionicons size={25} color={headerTextColor} name="arrow-back" />
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
        <Text
          style={{
            marginTop: 12,
            marginHorizontal: 12,
            fontSize: 13,
            opacity: 0.75,
            color: textColor,
            textAlign: 'center',
          }}>
          Select people to add to this group.
        </Text>
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
                  item?.profile_image && typeof item?.profile_image === 'string'
                    ? {uri: item.profile_image}
                    : images.profile
                }
                style={{borderRadius: 5, width: 40, height: 40}}
              />
              <Text style={{textAlign: 'center', width: 60, marginTop: 5}}>
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
          {loadingAdd && (
            <ActivityIndicator size="small" style={{marginRight: 10}} />
          )}
          <TouchableOpacity
            disabled={!participents?.length || loadingAdd}
            onPress={addMembers}>
            <Text
              style={{
                color: textColor,
                opacity: participents?.length ? 1 : 0.45,
              }}>
              Add members
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{marginTop: 10, marginHorizontal: 10}}>Suggested</Text>
        {loading && <ActivityIndicator size="small" />}
        <FlatList
          data={sortByUser(List)}
          showsVerticalScrollIndicator={false}
          style={{width: '90%', marginTop: 20, height: screenHeight - 240}}
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
                    item?.profile_image &&
                    typeof item?.profile_image === 'string'
                      ? {uri: item.profile_image}
                      : images.profile
                  }
                  style={{
                    borderRadius: 5,
                    width: 50,
                    height: 50,
                    marginRight: 20,
                  }}
                />
                <Text>{item?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (participents?.some(e => e?.id === item?.id)) {
                    const removed = participents?.filter(e => e?.id !== item?.id);
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

export default connect(mapStateToProps, mapDispatchToProps)(AddGroupMembers);
