import {StyleSheet} from 'react-native';
import {shadow} from '../ThemeProvider/redux/saga';

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  newRegistrationView: {
    paddingTop: 56,
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  newRegistrationText: {
    fontSize: 18,
    left: 8,
    fontWeight: '600',
  },
  registrationInputView: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingTop: 28,
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
    ...shadow.card,
  },
  registrationTextView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  registrationText: {
    fontSize: 24,
    fontWeight: '700',
  },
  labelStyle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  inputFocus: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 14,
    height: 48,
    alignItems: 'center',
  },
  emailImgView: {justifyContent: 'center', marginRight: 10},
  passView: {flexDirection: 'row'},

  entryInformationText: {
    fontSize: 14,
    fontWeight: '400',
    alignSelf: 'flex-start',
    marginBottom: 8,
    lineHeight: 20,
  },
  pictureView: {
    marginTop: 24,
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pictureText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    width: 87,
  },
  userPictureCircleWithCamera: {
    width: 103,
    height: 103,
  },
  userPicture: {
    width: 75,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputStyle: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    paddingLeft: 14,
    height: 48,
  },
  byClickText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 16,
    lineHeight: 18,
  },
  termsAndConditionText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
  },
});

export default styles;
