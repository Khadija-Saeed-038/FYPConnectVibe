import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {Toast} from 'react-native-toast-notifications';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {yupResolver} from '@hookform/resolvers/yup';
import {Controller, useForm} from 'react-hook-form';

import * as yup from 'yup';

import {emailRegex} from '../../Utils/function';
import Button from '../../Components/Button';
import {signup as signupAction} from './redux/action';
import styles from './style';
import {connect} from 'react-redux';
import Input from '../../Components/Input';
import Error from '../../Components/Input/Error';
import {useThemeColor} from '../ThemeProvider/redux/saga';

const schema = yup.object({
  name: yup.string().required('This field is required'),
  email: yup
    .string()
    .required('This field is required')
    .matches(emailRegex, 'Email is invalid'),
  phone: yup.string().required('This field is required'),
  password: yup.string().required('This field is required'),
  confirmPassword: yup.string().required('This field is required'),
});

const Signup = ({navigation, signupAction, requesting}) => {
  const [passwordView, setPasswordView] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });
  const signupButton = data => {
    if (data.password !== data.confirmPassword) {
      Toast.show('Password must be same');
    } else {
      signupAction(
        {
          name: data.name,
          email: data.email,
          phone: data.phone.trim(),
          password: data.password.trim(),
        },
        callBack,
      );
    }
  };
  const callBack = () => {
    /* Root navigator switches to App stack after loginSuccess (token set). */
  };

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const cardBackgroundColor = useThemeColor('cardBackground');
  const buttonColor = useThemeColor('buttonColor');
  const inputBackgroundColor = useThemeColor('inputBackground');
  const borderColor = useThemeColor('border');
  const placeholderColor = useThemeColor('placeholder');

  return (
    <>
      <View style={[styles.main, {backgroundColor: backgroundColor}]}>
        <View
          style={[
            styles.newRegistrationView,
            {backgroundColor: backgroundColor},
          ]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons size={25} color={textColor} name={'arrow-back'} />
          </TouchableOpacity>
          <Text style={[styles.newRegistrationText, {color: textColor}]}>
            New Registration
          </Text>
        </View>
        <View
          style={[
            styles.registrationInputView,
            {backgroundColor: cardBackgroundColor},
          ]}>
          <View style={styles.registrationTextView}>
            <Text style={[styles.registrationText, {color: textColor}]}>
              New Registration
            </Text>
          </View>
          <Text style={[styles.entryInformationText, {color: textSecondary}]}>
            Please enter the following information to create a new account.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.labelStyle, {color: textColor}]}>User Name</Text>

            <View
              style={[
                styles.inputFocus,
                {backgroundColor: inputBackgroundColor, borderColor},
              ]}>
              <View style={styles.emailImgView}>
                <Entypo size={17} color={textSecondary} name={'user'} />
              </View>
              <Controller
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    placeholderColor={placeholderColor}
                    placeholder={'John'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="name"
              />
            </View>

            <Error errors={errors?.name} />

            <Text style={[styles.labelStyle, {color: textColor}]}>Email</Text>

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
              <Controller
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    placeholderColor={placeholderColor}
                    placeholder={'example@test.com'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="email"
              />
            </View>

            <Error errors={errors?.email} />

            <Text style={[styles.labelStyle, {color: textColor}]}>Phone_no</Text>

            <View
              style={[
                styles.inputFocus,
                {backgroundColor: inputBackgroundColor, borderColor},
              ]}>
              <View style={styles.emailImgView}>
                <MaterialCommunityIcons
                  size={17}
                  color={textSecondary}
                  name={'phone'}
                />
              </View>
              <Controller
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    placeholderColor={placeholderColor}
                    placeholder={'123456789'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="phone"
              />
            </View>
            <Error errors={errors?.phone} />

            <Text style={[styles.labelStyle, {color: textColor}]}>Password</Text>
            <View
              style={[
                styles.inputFocus,
                {backgroundColor: inputBackgroundColor, borderColor},
              ]}>
              <View
                style={[styles.passView, {justifyContent: 'space-between'}]}>
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

            <Error errors={errors?.password} />

            <Text style={[styles.labelStyle, {color: textColor}]}>
              Confirm Password
            </Text>
            <View
              style={[
                styles.inputFocus,
                {backgroundColor: inputBackgroundColor, borderColor},
              ]}>
              <View
                style={[styles.passView, {justifyContent: 'space-between'}]}>
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
                    name="confirmPassword"
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
            <Error errors={errors?.confirmPassword} />

            <Button
              onPress={handleSubmit(signupButton)}
              text={'Register'}
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
            />
          </ScrollView>
        </View>
      </View>
    </>
  );
};

const mapStateToProps = state => ({
  requesting: state?.signUp?.requesting,
});

const mapDispatchToProps = dispatch => ({
  signupAction: (data, callBack) => dispatch(signupAction(data, callBack)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Signup);
