import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {resolveBlockedMapToRows} from '../../Utils/blockedUsersList';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import {getStyles} from '../ChatScreen/style';

const PrivacyScreen = ({navigation, theme}) => {
  const styles = getStyles(theme);
  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');

  const [uid, setUid] = useState(() => auth().currentUser?.uid || null);
  const [blockedRows, setBlockedRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(u => {
      setUid(u?.uid || null);
    });
    return unsub;
  }, []);

  const applyBlocked = useCallback(async blockedMap => {
    const rows = await resolveBlockedMapToRows(blockedMap || {});
    setBlockedRows(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!uid) {
      setBlockedRows([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const ref = database().ref(`Blocks/${uid}/blocked`);
    const onVal = snap => {
      applyBlocked(snap.val() || {});
    };
    ref.on('value', onVal);
    return () => ref.off('value', onVal);
  }, [uid, applyBlocked]);

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
          <Text style={[styles.userName, {color: headerTextColor}]}>Privacy</Text>
        </View>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 32}}>
        <Text
          style={{
            fontSize: 12,
            color: textColor,
            opacity: 0.65,
            marginBottom: 12,
          }}>
          Blocked users and blocked group threads appear here.
        </Text>
        {!uid ? (
          <Text style={{color: textColor, opacity: 0.7}}>
            Sign in to view blocked accounts.
          </Text>
        ) : loading ? (
          <ActivityIndicator color={textColor} style={{marginVertical: 24}} />
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
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
});

export default connect(mapStateToProps)(PrivacyScreen);
