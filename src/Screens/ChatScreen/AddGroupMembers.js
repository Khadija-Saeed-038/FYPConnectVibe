import React, {useEffect, useMemo, useState} from 'react';
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
import Button from '../../Components/Button';

const AddGroupMembers = ({
  navigation,
  route,
  userDetail,
  theme,
  getUserAction,
  userSearched,
  searchLoading,
}) => {
  const messageuid = route?.params?.messageuid;
  const [state, setState] = useState({
    allEmployee: [],
    participents: [],
    List: [],
    searchText: '',
    existingMemberIds: [],
    roomLoading: true,
    loadingAdd: false,
  });

  const {
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

  useEffect(() => {
    users.value = userSearched;
    setState(pre => ({
      ...pre,
      allEmployee: userSearched,
      List: userSearched,
    }));
  }, [userSearched, users]);

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
      const r = await addGroupMembers(
        messageuid,
        participents,
        userDetail?.id,
        userDetail,
      );
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

  const canAdd = participents.length > 0 && !loadingAdd;
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
        Select people to add to this group.
      </Text>
      <Text style={styles.sectionTitle}>Suggested</Text>
      {searchLoading ? <ActivityIndicator size="small" color={textColor} /> : null}
    </View>
  );

  if (roomLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {backgroundColor, justifyContent: 'center'},
          androidStatusBarInset > 0 && {paddingTop: androidStatusBarInset},
        ]}>
        <ActivityIndicator color={textColor} />
      </SafeAreaView>
    );
  }

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
            text="Add members"
            onPress={addMembers}
            loading={loadingAdd}
            disabled={!canAdd}
            containerStyle={[
              {backgroundColor: buttonColor},
              !canAdd && styles.buttonDisabledOpacity,
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

export default connect(mapStateToProps, mapDispatchToProps)(AddGroupMembers);
