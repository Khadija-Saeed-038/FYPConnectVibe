import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import styles from './style';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function TermAndConditions({navigation}) {
  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      <StatusBar
        animated={true}
        backgroundColor={headerBackgroundColor}
        barStyle={'light-content'}
      />
      <View
        style={[
          styles.headerContainer,
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
        <Text style={[styles.header, {color: headerTextColor}]}>
          Terms & Conditions
        </Text>
      </View>

      <ScrollView contentContainerStyle={{paddingVertical: 16}}>
        <Text style={[styles.description, {color: textSecondary}]}>
          Welcome to ConnectVibe! These terms and conditions outline the rules
          and regulations for the use of ConnectVibe&apos;s services. By
          accessing this app, we assume you accept these terms and conditions.
          Do not continue to use ConnectVibe if you do not agree to all of the
          terms and conditions stated on this page.
        </Text>

        <Text style={[styles.description, {color: textSecondary}]}>
          To create an account on ConnectVibe, users must be at least 13 years
          old and provide accurate and complete registration information. Users
          are responsible for maintaining the confidentiality of their account
          information and for all activities that occur under their account.
        </Text>

        <Text style={[styles.description, {color: textSecondary}]}>
          Users retain ownership of any intellectual property rights that they
          hold in the content they post on ConnectVibe. By posting content,
          you grant ConnectVibe a worldwide, non-exclusive, royalty-free license
          to use, reproduce, modify, and distribute your content in connection
          with the operation of the service.
        </Text>

        <Text style={[styles.description, {color: textSecondary}]}>
          Users must not use the service for any illegal activities or harass,
          abuse, or harm another person through the service. Additionally,
          users must not upload viruses or other malicious code that could harm
          the service or other users.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
