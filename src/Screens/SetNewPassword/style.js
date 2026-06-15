import {StyleSheet} from 'react-native';
import {shadow} from '../ThemeProvider/redux/saga';

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  newPasswordView: {
    paddingTop: 56,
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  backTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newPasswordText: {
    fontSize: 18,
    fontWeight: '600',
    left: 8,
  },
  passwordInputView: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    ...shadow.card,
  },

  setNewPasswordText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
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

  button: {
    marginTop: 24,
    height: 52,
  },
});

export default styles;
