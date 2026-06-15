import {StyleSheet} from 'react-native';
import {shadow} from '../ThemeProvider/redux/saga';

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  enterCodeView: {
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
  enterCodedText: {
    fontSize: 18,
    fontWeight: '600',
    left: 8,
  },
  codeInputView: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    ...shadow.card,
  },
  verificationCodeText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  enterCodeText: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
    lineHeight: 20,
  },
  userEmailText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
    textDecorationLine: 'underline',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  codeFieldRoot: {marginTop: 8, width: '100%'},
  cell: {
    flex: 1,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '600',
    paddingTop: 12,
    marginRight: 4,
    marginLeft: 4,
    height: 56,
    width: 52,
    borderWidth: 1,
    borderRadius: 12,
  },
  focusCell: {
    fontSize: 24,
    fontWeight: '700',
  },
  CodeWrapper: {
    paddingBottom: 8,
  },
  button: {
    marginTop: 24,
    height: 52,
    width: '100%',
  },
});

export default styles;
