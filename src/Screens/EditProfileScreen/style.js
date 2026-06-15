import {StyleSheet} from 'react-native';
import {getThemeColor} from '../ThemeProvider/redux/saga';

export const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getThemeColor('primary', theme),
    },
    header: {
      backgroundColor: getThemeColor('headerColor', theme),
      height: 72,
      borderBottomWidth: 1,
      borderBottomColor: getThemeColor('border', theme),
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerText: {
      color: getThemeColor('headerText', theme),
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '600',
    },
    ImgView: {
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 32,
    },
    profileImg: {
      margin: -0.7,
      height: '100%',
      width: '100%',
      borderRadius: 75,
    },
    imageView: {
      height: 140,
      backgroundColor: getThemeColor('inputBackground', theme),
      width: 140,
      borderRadius: 70,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: getThemeColor('border', theme),
    },
    imgTxt: {
      color: getThemeColor('textSecondary', theme),
      fontSize: 36,
      fontWeight: '600',
    },
    camImg: {
      position: 'relative',
      left: 45,
      borderWidth: 2,
      borderColor: getThemeColor('cardBackground', theme),
      backgroundColor: getThemeColor('buttonColor', theme),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      bottom: 40,
      height: 40,
      width: 40,
      overflow: 'hidden',
    },
    input: {
      backgroundColor: 'transparent',
      marginVertical: 5,
    },
    text: {
      color: getThemeColor('text', theme),
    },
    placeholder: {color: getThemeColor('placeholder', theme)},
    buttonCon: {
      alignSelf: 'flex-end',
      marginHorizontal: 20,
      width: 100,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      marginVertical: 20,
    },
    btnText: {
      color: getThemeColor('textOnButton', theme),
      fontSize: 16,
      fontWeight: '600',
    },
  });
