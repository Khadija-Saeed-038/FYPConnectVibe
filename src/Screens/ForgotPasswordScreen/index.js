import React, {useState} from 'react';
import {Text, TouchableOpacity, View, StatusBar} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {forgotPassword as forgotPasswordAction} from './redux/actions';

import styles from './style';
import Button from '../../Components/Button';

import {connect} from 'react-redux';
import {emailRegex} from '../../Utils/function';
import Input from '../../Components/Input';
import {useThemeColor} from '../ThemeProvider/redux/saga';

const ForgotPassword = ({navigation, forgotPasswordAction, requesting}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);

  const onCheckEmail = value => {
    setEmail(value);
    setEmailError('');
  };

  const onForgotPassword = () => {
    if (!email) {
      setEmailError('Email is required');
    } else if (!emailRegex.test(email)) {
      setEmailError('Email must be valid');
    } else {
      const data = {
        email: email,
      };
      forgotPasswordAction(data, callBack);
    }
  };
  const callBack = () => {
    navigation.navigate('Login');
  };

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const cardBackgroundColor = useThemeColor('cardBackground');
  const buttonColor = useThemeColor('buttonColor');
  const inputBackgroundColor = useThemeColor('inputBackground');
  const borderColor = useThemeColor('border');
  const placeholderColor = useThemeColor('placeholder');
  const errorColor = useThemeColor('error');

  return (
    <View style={[styles.main, {backgroundColor: backgroundColor}]}>
      <View style={[styles.loginView, {backgroundColor: backgroundColor}]}>
        <TouchableOpacity
          style={styles.backTouchable}
          onPress={() => navigation.goBack()}>
          <Ionicons size={25} color={textColor} name={'arrow-back'} />
        </TouchableOpacity>
        <Text style={[styles.forgetPasswordText, {color: textColor}]}>
          Forgot your password
        </Text>
      </View>

      <View
        style={[styles.EmailInputView, {backgroundColor: cardBackgroundColor}]}>
        <Text style={[styles.enterEmailText, {color: textColor}]}>
          Enter email
        </Text>

        <View
          style={[
            styles.inputFocus,
            {backgroundColor: inputBackgroundColor, borderColor},
          ]}>
          <View style={styles.emailImgView}>
            <MaterialCommunityIcons
              size={17}
              color={textSecondary}
              name={'email'}
            />
          </View>

          <Input
            placeholderColor={placeholderColor}
            placeholder={'example@test.com'}
            value={email}
            onChangeText={value => onCheckEmail(value)}
          />
        </View>
        {emailError ? (
          <Text style={[styles.emailError, {color: errorColor}]}>
            {emailError}
          </Text>
        ) : (
          ''
        )}
        <Button
          onPress={onForgotPassword}
          text={'Send Code'}
          textStyle={{
            fontSize: 20,
            fontWeight: 'bold',
          }}
          loading={requesting}
          containerStyle={[
            styles.button,
            {
              backgroundColor: buttonColor,
            },
          ]}
          disabled={requesting}
        />
      </View>
    </View>
  );
};

const mapStateToProps = state => ({
  requesting: state?.forgotPassword?.requesting,
});

const mapDispatchToProps = dispatch => ({
  forgotPasswordAction: (data, callBack) =>
    dispatch(forgotPasswordAction(data, callBack)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ForgotPassword);
