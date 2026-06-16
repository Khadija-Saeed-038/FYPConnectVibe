import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
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
import Button from '../../Components/Button';

const CreateGroup = ({
  navigation,
  userDetail,
  theme,
  getUserAction,
  userSearched,
  searchLoading,
}) => {
  const [state, setState] = useState({
    loadingCreate: false,
    allEmployee: [],
    participents: [],
    List: [],
    searchText: '',
    groupName: '',
  });

  const {searchText, allEmployee, List, participents, groupName, loadingCreate} =
    state;

  const {images} = useImages();
  const styles = getStyles(theme);
  const isFocused = useIsFocused();
  const users = signal(userSearched);

  const handleChange = (key, value) => {
    setState(pre => ({...pre, [key]: value}));
  };

  useEffect(() => {
    getUserAction('');
  }, [isFocused, getUserAction]);

  useEffect(() => {
    users.value = userSearched;
    setState(pre => ({
      ...pre,
      allEmployee: userSearched,
      List: userSearched,
    }));
  }, [userSearched, users]);

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

  const toggleParticipant = item => {
    if (participents?.some(e => e?.id === item?.id)) {
      handleChange(
        'participents',
        participents.filter(e => e?.id !== item?.id),
      );
    } else {
      handleChange('participents', [...participents, item]);
    }
  };

  const removeParticipant = itemId => {
    handleChange(
      'participents',
      participents.filter(e => e?.id !== itemId),
    );
  };

  const getParticipentsIDs = () => {
    return participents.map(element => element?.id).filter(Boolean);
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
    const groupMemberIds = [userDetail?.id, ...getParticipentsIDs()].filter(
      Boolean,
    );
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

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');
  const buttonColor = useThemeColor('buttonColor');
  const placeholderColor = useThemeColor('placeholder');
  const searchBar = useThemeColor('inputBackground');
  const androidStatusBarInset =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const nameTrim = String(groupName || '').trim();
  const canCreate = !!nameTrim && participents.length > 0 && !loadingCreate;
  const sortedList = sortByUser(List) || [];

  const renderSelectedChip = ({item}) => (
    <View style={styles.selectedChip}>
      <TouchableOpacity
        onPress={() => removeParticipant(item?.id)}
        style={styles.selectedChipRemove}>
        <Entypo name="cross" color="red" size={14} />
      </TouchableOpacity>
      <Image
        source={
          item?.profile_image && typeof item?.profile_image === 'string'
            ? {uri: item.profile_image}
            : images.profile
        }
        style={styles.selectedChipAvatar}
      />
      <Text style={styles.selectedChipName} numberOfLines={1}>
        {item?.name}
      </Text>
    </View>
  );

  const renderMemberRow = ({item}) => {
    const selected = participents?.some(e => e?.id === item?.id);
    return (
      <TouchableOpacity
        style={styles.memberRow}
        activeOpacity={0.7}
        onPress={() => toggleParticipant(item)}>
        <View style={styles.memberRowLeft}>
          <Image
            source={
              item?.profile_image && typeof item?.profile_image === 'string'
                ? {uri: item.profile_image}
                : images.profile
            }
            style={styles.memberAvatar}
          />
          <Text style={styles.memberName} numberOfLines={1}>
            {item?.name}
          </Text>
        </View>
        <Fontisto
          color={textColor}
          size={22}
          name={selected ? 'checkbox-active' : 'checkbox-passive'}
        />
      </TouchableOpacity>
    );
  };

  const listHeader = () => (
    <View style={styles.listHeaderBlock}>
      <Text style={styles.helperTextLeft}>
        Select people below. You can add as many members as you want.
      </Text>
      <Text style={styles.sectionTitle}>Suggested</Text>
      {searchLoading ? <ActivityIndicator size="small" color={textColor} /> : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor},
        androidStatusBarInset > 0 && {paddingTop: androidStatusBarInset},
      ]}>
      <StatusBar
        animated
        backgroundColor={headerBackgroundColor}
        barStyle="light-content"
      />

      <View style={styles.childContainerStyle}>
        <View
          style={[
            styles.header,
            {backgroundColor: headerBackgroundColor, borderBottomColor: borderColor},
          ]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButtonHit}>
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

        <View style={styles.groupNameSection}>
          <Text style={styles.groupNameLabel}>Group name</Text>
          <TextInput
            placeholderTextColor={placeholderColor}
            placeholder="e.g. Family, Work team"
            style={styles.groupNameInput}
            value={groupName}
            onChangeText={value => handleChange('groupName', value)}
          />
        </View>

        {participents.length > 0 ? (
          <FlatList
            data={participents}
            horizontal
            keyExtractor={item => String(item?.id)}
            style={styles.selectedChipsRow}
            showsHorizontalScrollIndicator={false}
            renderItem={renderSelectedChip}
          />
        ) : null}

        <FlatList
          data={sortedList}
          keyExtractor={item => String(item?.id)}
          style={styles.listFlex}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>No users found</Text>
            </View>
          }
          renderItem={renderMemberRow}
        />

        <View style={styles.bottomBar}>
          {participents.length > 0 ? (
            <Text style={styles.selectionCount}>
              {participents.length === 1
                ? '1 member selected'
                : `${participents.length} members selected`}
            </Text>
          ) : null}
          <Button
            text="Create group"
            onPress={createMessageList}
            loading={loadingCreate}
            disabled={!canCreate}
            containerStyle={[
              {backgroundColor: buttonColor},
              !canCreate && styles.buttonDisabledOpacity,
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
  userSearched: state?.searchUser?.profile,
  searchLoading: state?.searchUser?.requesting,
  userDetail: state?.login?.userDetail?.user,
});

const mapDispatchToProps = dispatch => ({
  getUserAction: data => dispatch(getUserAction(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateGroup);
