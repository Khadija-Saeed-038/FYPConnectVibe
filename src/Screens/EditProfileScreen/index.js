import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import React, {useEffect, useLayoutEffect, useState} from 'react';
import * as yup from 'yup';
import {TextInput} from 'react-native-paper';
import {yupResolver} from '@hookform/resolvers/yup';
import {Controller, useForm} from 'react-hook-form';
import {connect} from 'react-redux';
import {useIsFocused} from '@react-navigation/native';

import {emailRegex} from '../../Utils/function';
import {getStyles} from './style';
import {
  updateProfile as updateProfileAction,
  getProfile as getProfileAction,
} from './redux/actions';
import Button from '../../Components/Button';
import Error from '../../Components/Input/Error';
import {useThemeColor} from '../ThemeProvider/redux/saga';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** Count digits only so "+1 234 567 890" and "1234567890" both work. E.164 allows up to 15 digits. */
function isValidPhoneDigits(v) {
  const digits = String(v).replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

const schema = yup.object({
  name: yup.string().trim().required(),
  phone: yup
    .string()
    .transform(v => (v == null ? '' : String(v)))
    .test(
      'phone',
      'Invalid phone number',
      v => !v.trim() || isValidPhoneDigits(v),
    )
    .label('Phone Number'),
  email: yup.string().matches(emailRegex, 'Enter a valid email').label('Email'),
});

function normStr(v) {
  return (v == null ? '' : String(v)).trim();
}

function profileBaseline(profileData, userDetail) {
  const fromFs =
    profileData && typeof profileData === 'object' ? profileData : null;
  const phoneFromFs =
    fromFs?.phone != null && String(fromFs.phone) !== ''
      ? String(fromFs.phone)
      : '';
  const phone = phoneFromFs || (userDetail?.phone != null ? String(userDetail.phone) : '');
  return {
    name: normStr(fromFs?.name || userDetail?.name),
    phone: normStr(phone),
  };
}

/** Seed react-hook-form on mount so fields are not blank before effects run (e.g. after goBack → open again). */
function getFormDefaults(profileData, userDetail) {
  const fromFs =
    profileData && typeof profileData === 'object' ? profileData : null;
  return {
    name: fromFs?.name || userDetail?.name || '',
    email:
      fromFs?.user_email ||
      fromFs?.email ||
      userDetail?.email ||
      '',
    phone:
      fromFs?.phone != null && String(fromFs.phone) !== ''
        ? String(fromFs.phone)
        : userDetail?.phone != null
          ? String(userDetail.phone)
          : '',
    password: '',
  };
}

const EditProfile = ({
  updateProfileAction,
  requesting,
  profileData,
  theme,
  userDetail,
  getProfileAction,
  navigation,
}) => {
  const {
    control,
    setValue,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: getFormDefaults(profileData, userDetail),
  });
  const [loading, setLoading] = useState(false);

  const isFocused = useIsFocused();
  const styles = getStyles(theme);

  const updateProfileButton = data => {
    const id = profileData?.id || userDetail?.id;
    if (!id) {
      return;
    }
    const baseline = profileBaseline(profileData, userDetail);
    const nextName = normStr(data.name);
    const nextPhone = normStr(data.phone);
    const nameChanged = nextName !== baseline.name;
    const phoneChanged = nextPhone !== baseline.phone;
    const passwordChanged = !!data.password;

    if (!nameChanged && !phoneChanged && !passwordChanged) {
      return;
    }

    const payload = {id};
    if (nameChanged) {
      payload.name = nextName;
    }
    if (phoneChanged) {
      payload.phone = nextPhone;
    }
    if (passwordChanged) {
      payload.new_password = data.password;
    }
    updateProfileAction(payload);
  };

  useEffect(() => {
    if (!userDetail?.id || !isFocused) {
      return;
    }
    setLoading(true);
    getProfileAction({id: userDetail?.id});
  }, [isFocused, userDetail?.id]);

  // Prefill from Redux login user immediately; refine when Firestore GET succeeds.
  useLayoutEffect(() => {
    const fromFs =
      profileData && typeof profileData === 'object' ? profileData : null;
    const id = fromFs?.id || userDetail?.id;
    if (!id) {
      return;
    }
    setValue(
      'name',
      fromFs?.name || userDetail?.name || '',
    );
    setValue(
      'email',
      fromFs?.user_email || fromFs?.email || userDetail?.email || '',
    );
    setValue(
      'phone',
      fromFs?.phone != null && fromFs.phone !== ''
        ? fromFs.phone
        : userDetail?.phone || '',
    );
  }, [profileData, userDetail, setValue]);

  const backgroundColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const headerBackgroundColor = useThemeColor('headerColor');
  const headerTextColor = useThemeColor('headerText');
  const borderColor = useThemeColor('border');
  const buttonColor = useThemeColor('buttonColor');

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
          {backgroundColor: headerBackgroundColor, borderBottomColor: borderColor},
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{justifyContent: 'center', height: 45}}>
          <Ionicons size={25} color={headerTextColor} name={'arrow-back'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <ScrollView>
        <View style={styles.ImgView}>
          <View style={styles.imageView}>
            <Text style={styles.imgTxt}>N/A</Text>
          </View>
        </View>
        <View style={{marginHorizontal: 20}}>
          <Controller
            control={control}
            render={({field: {onChange, onBlur, value}}) => (
              <TextInput
                label="username"
                value={value}
                onChangeText={onChange}
                placeholder={'AdminTest'}
                textColor={textColor}
                activeUnderlineColor={textColor}
                placeholderTextColor={styles.placeholder}
                style={styles.input}
              />
            )}
            name="name"
          />
          <Error errors={errors.name} />
          <Controller
            control={control}
            render={({field: {onChange, onBlur, value}}) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                placeholder={'example@test.com'}
                textColor={styles.placeholder.color}
                placeholderTextColor={styles.placeholder}
                style={styles.input}
                editable={false}
              />
            )}
            name="email"
          />
          <Controller
            control={control}
            render={({field: {onChange, onBlur, value}}) => (
              <TextInput
                label="Phone"
                value={value}
                onChangeText={onChange}
                placeholder={'123456789'}
                textColor={textColor}
                activeUnderlineColor={textColor}
                placeholderTextColor={styles.placeholder}
                style={styles.input}
              />
            )}
            name="phone"
          />
          <Error errors={errors.phone} />

          <Controller
            control={control}
            render={({field: {onChange, onBlur, value}}) => (
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                textColor={textColor}
                activeUnderlineColor={textColor}
                placeholder={'12345'}
                placeholderTextColor={styles.placeholder}
                style={styles.input}
              />
            )}
            name="password"
          />
        </View>

        <View>
          <Button
            text={'Save'}
            loading={requesting}
            containerStyle={[
              styles.buttonCon,
              {
                backgroundColor: textColor,
              },
            ]}
            onPress={handleSubmit(updateProfileButton)}
            disabled={requesting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  requesting: state?.editProfile?.requesting,
  profileData: state?.editProfile?.profile,
  theme: state?.themes?.theme,
  userDetail: state?.login?.userDetail?.user,
});

const mapDispatchToProps = dispatch => ({
  getProfileAction: data => dispatch(getProfileAction(data)),
  updateProfileAction: data => dispatch(updateProfileAction(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditProfile);
