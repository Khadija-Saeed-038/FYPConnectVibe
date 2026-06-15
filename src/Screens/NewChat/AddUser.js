import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  FlatList,
  Text,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import {openDirectChat} from '../../Utils/openDirectChat';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import {getUser as getUserAction} from './redux/action';
import styles from './style';
import {Toast} from 'react-native-toast-notifications';

const height = Dimensions.get('window').height;

const AddUser = ({
  navigation,
  getUserAction,
  userSearched,
  loading,
  userDetail,
}) => {
  const [searchName, setSearchName] = useState('');
  const [creatingRoomId, setCreatingRoomId] = useState(null);
  const creatingInFlight = useRef(false);

  const handleSearch = val => {
    setSearchName(val);
  };

  const createAndNavigate = item => {
    if (creatingInFlight.current) {
      return;
    }
    const myId = userDetail?.id;
    const peerId = item?.id;
    if (!myId || !peerId) {
      Toast.show('Missing user info');
      return;
    }
    if (String(myId) === String(peerId)) {
      Toast.show('You cannot message yourself');
      return;
    }

    creatingInFlight.current = true;
    setCreatingRoomId(peerId);

    (async () => {
      try {
        await openDirectChat({navigation, userDetail, peer: item});
      } finally {
        creatingInFlight.current = false;
        setCreatingRoomId(null);
      }
    })();
  };

  useEffect(() => {
    const q = (searchName || '').trim();
    const timer = setTimeout(
      () => getUserAction(q),
      q.length > 0 ? 280 : 0,
    );
    return () => clearTimeout(timer);
  }, [searchName, getUserAction]);

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const textOnButton = useThemeColor('textOnButton');
  const buttonColor = useThemeColor('buttonColor');
  const borderColor = useThemeColor('border');
  const placeholderColor = useThemeColor('placeholder');
  const searchBar = useThemeColor('inputBackground');

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: backgroundColor}]}>
      <StatusBar
        animated={true}
        backgroundColor={headerBackgroundColor}
        barStyle={'light-content'}
      />
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
          <Ionicons size={25} color={headerTextColor} name={'arrow-back'} />
        </TouchableOpacity>

        <TextInput
          value={searchName}
          placeholderTextColor={placeholderColor}
          placeholder="Search users"
          style={[
            styles.searchContainer,
            {backgroundColor: searchBar, borderWidth: 1, borderColor},
          ]}
          onChangeText={handleSearch}
        />
      </View>

      <View style={{width: '90%', marginTop: 10, marginHorizontal: '5%'}}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateGroup')}
          style={{
            backgroundColor: buttonColor,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{color: textOnButton, fontWeight: '600', fontSize: 16}}>
            Create Group
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 12,
              marginTop: 4,
              textAlign: 'center',
            }}>
            Select multiple people and name your group
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          marginVertical: 20,
          marginHorizontal: 20,
          height: height - 110,
        }}>
        {loading ? (
          <View style={{marginVertical: '50%'}}>
            <ActivityIndicator color={textColor} size={'large'} />
          </View>
        ) : Array.isArray(userSearched) && userSearched.length > 0 ? (
          <FlatList
            data={userSearched}
            keyExtractor={item => String(item?.id)}
            renderItem={({item, index}) => (
              <>
                <TouchableOpacity
                  style={[
                    styles.chatContainer,
                    {borderBottomColor: borderColor},
                  ]}
                  disabled={creatingRoomId != null}
                  onPress={() => createAndNavigate(item)}>
                  <View
                    style={[
                      styles.imageContainer,
                      {backgroundColor: buttonColor},
                    ]}>
                    {(!item?.profile_image || typeof item?.profile_image !== 'string') ? (
                      <Text style={[styles.imgText, {color: textOnButton}]}>
                        {(item?.name || '?').trim().charAt(0).toUpperCase() || '?'}
                      </Text>
                    ) : (
                      <Image
                        source={{uri: item?.profile_image}}
                        style={styles.image}
                      />
                    )}
                  </View>
                  <View style={styles.textContainer} key={index}>
                    <View style={{marginLeft: 10}}>
                      <Text style={[styles.userName, {color: textColor}]}>
                        {item?.name}
                      </Text>
                    </View>
                  </View>
                  {String(creatingRoomId) === String(item.id) ? (
                    <ActivityIndicator color={textColor} size="small" />
                  ) : null}
                </TouchableOpacity>
              </>
            )}
          />
        ) : (
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: '50%',
            }}>
            <Text style={{color: textColor}}>No user Found</Text>
          </View>
        )}
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
export default connect(mapStateToProps, mapDispatchToProps)(AddUser);
