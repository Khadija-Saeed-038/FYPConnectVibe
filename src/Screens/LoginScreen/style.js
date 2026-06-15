import {StyleSheet} from 'react-native';
import {shadow} from '../ThemeProvider/redux/saga';

const styles = StyleSheet.create({
  mainView: {
    marginHorizontal: 24,
  },
  labelStyle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputFocus: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    height: 48,
    alignItems: 'center',
  },
  loginImage: {
    marginTop: 60,
    alignSelf: 'center',
    height: 68,
    width: 103,
  },
  cardView: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 24,
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    ...shadow.card,
  },
  logoImgView: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImg: {height: 19, width: 200},
  cardHeader: {
    paddingBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInTxt: {fontWeight: '700', fontSize: 28},
  subTxt: {fontWeight: '400', fontSize: 14, marginTop: 6},
  emailImg: {height: 13, width: 16},
  forgotPass: {
    fontWeight: '500',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  passView: {flexDirection: 'row'},
  emailImgView: {justifyContent: 'center', marginRight: 10},

  createAnAccountView: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
    justifyContent: 'center',
  },
  createAnAccountText: {
    fontSize: 14,
    fontWeight: '400',
  },
  fontWeightBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default styles;
