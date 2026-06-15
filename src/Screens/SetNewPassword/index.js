import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import {connect} from 'react-redux';
import {yupResolver} from '@hookform/resolvers/yup';
import {Controller, useForm} from 'react-hook-form';
import * as yup from 'yup';
import {Toast} from 'react-native-toast-notifications';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Foundation from 'react-native-vector-icons/Foundation';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {setNewPassword as setNewPasswordAction} from '../ForgotPasswordScreen/redux/actions';

import styles from './style';
import Button from '../../Components/Button';
import Input from '../../Components/Input';
import {useState} from 'react';
import Error from '../../Components/Input/Error';
import {useThemeColor} from '../ThemeProvider/redux/saga';

const schema = yup.object({
  password: yup.string().required('This field is required'),
  confirm_password: yup.string().required('This field is required'),
});

const SetNewPassword = ({
  route,
  navigation,
  setNewPasswordAction,
  passwordRequesting,
}) => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [passwordView, setPasswordView] = useState(false);

  const onSure = data => {
    if (data.confirm_password !== data.password) {
      Toast.show('Password must be same');
    } else {
      const changePasswordData = {
        token: route?.params?.code,
        password: data?.password,
      };
      setNewPasswordAction(changePasswordData, callBack);
    }
  };
  const callBack = () => {
    navigation.navigate('Login');
  };

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const cardBackgroundColor = useThemeColor('cardBackground');
  const buttonColor = useThemeColor('buttonColor');
  const inputBackgroundColor = useThemeColor('inputBackground');
  const borderColor = useThemeColor('border');
  const textSecondary = useThemeColor('textSecondary');
  const placeholderColor = useThemeColor('placeholder');

  return (
    <View style={[styles.main, {backgroundColor: backgroundColor}]}>
      <View
        style={[styles.newPasswordView, {backgroundColor: backgroundColor}]}>
        <TouchableOpacity
          style={styles.backTouchable}
          onPress={() => navigation.goBack()}>
          <Ionicons size={25} color={textColor} name={'arrow-back'} />
        </TouchableOpacity>
        <Text style={[styles.newPasswordText, {color: textColor}]}>
          Set the new password
        </Text>
      </View>

      <View
        style={[
          styles.passwordInputView,
          {backgroundColor: cardBackgroundColor},
        ]}>
        <Text style={[styles.setNewPasswordText, {color: textColor}]}>
          Set new password
        </Text>

        <Text style={[styles.labelStyle, {color: textColor}]}>Password</Text>
        <View
          style={[
            styles.inputFocus,
            {backgroundColor: inputBackgroundColor, borderColor},
          ]}>
          <View style={[styles.passView, {justifyContent: 'space-between'}]}>
            <View style={{flexDirection: 'row', width: '89%'}}>
              <View style={styles.emailImgView}>
                <Foundation size={17} color={textSecondary} name={'key'} />
              </View>
              <Controller
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    placeholderColor={placeholderColor}
                    placeholder={'password'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    showPassword={passwordView}
                    secureTextEntry={true}
                  />
                )}
                name="password"
              />
            </View>
            <TouchableOpacity
              onPress={() => setPasswordView(!passwordView)}
              style={{justifyContent: 'center', marginRight: 5}}>
              <FontAwesome5
                size={15}
                color={textSecondary}
                name={passwordView ? 'eye' : 'eye-slash'}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Error errors={errors.password} />
        <Text style={[styles.labelStyle, {color: textColor}]}>
          Confirm Password
        </Text>
        <View
          style={[
            styles.inputFocus,
            {backgroundColor: inputBackgroundColor, borderColor},
          ]}>
          <View style={[styles.passView, {justifyContent: 'space-between'}]}>
            <View style={{flexDirection: 'row', width: '89%'}}>
              <View style={styles.emailImgView}>
                <Foundation size={17} color={textSecondary} name={'key'} />
              </View>
              <Controller
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    placeholderColor={placeholderColor}
                    placeholder={'c_password'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    showPassword={passwordView}
                    secureTextEntry={true}
                  />
                )}
                name="confirm_password"
              />
            </View>
            <TouchableOpacity
              onPress={() => setPasswordView(!passwordView)}
              style={{justifyContent: 'center', marginRight: 5}}>
              <FontAwesome5
                size={15}
                color={textSecondary}
                name={passwordView ? 'eye' : 'eye-slash'}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Error errors={errors.confirm_password} />

        <Button
          onPress={handleSubmit(onSure)}
          text={'Sure'}
          loading={passwordRequesting}
          containerStyle={[
            styles.button,
            {
              backgroundColor: buttonColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const mapStateToProps = state => ({
  passwordRequesting: state?.forgotPassword?.passwordRequesting,
});

const mapDispatchToProps = dispatch => ({
  setNewPasswordAction: (data, callBack) =>
    dispatch(setNewPasswordAction(data, callBack)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SetNewPassword);
