import {StyleSheet} from 'react-native';
import {shadow} from '../ThemeProvider/redux/saga';

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  loginView: {
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
  forgetPasswordText: {
    fontSize: 18,
    left: 8,
    fontWeight: '600',
  },

  EmailInputView: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingTop: 28,
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
    ...shadow.card,
  },

  enterEmailText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
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

  emailError: {alignSelf: 'flex-start', marginTop: 4},
  emailImgView: {justifyContent: 'center'},
  button: {
    marginTop: 24,
    height: 52,
  },
});

export default styles;
