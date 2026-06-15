import {StyleSheet, Dimensions} from 'react-native';
import {getThemeColor} from '../ThemeProvider/redux/saga';
const width = Dimensions.get('screen').width;
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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      alignItems: 'flex-end',
      paddingBottom: 16,
      flexDirection: 'row',
    },
    headerText: {
      color: getThemeColor('headerText', theme),
      fontSize: 20,
      fontWeight: '600',
    },
    searchContainer: {
      width: '95%',
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 12,
    },
    imageContainer: {
      backgroundColor: getThemeColor('buttonColor', theme),
      width: 48,
      height: 48,
      marginHorizontal: 3,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatContainer: {
      marginHorizontal: 16,
      marginTop: 4,
      flexDirection: 'row',
      width: width - 32,
      borderBottomWidth: 1,
      borderBottomColor: getThemeColor('border', theme),
      paddingVertical: 14,
    },
    imgText: {
      color: getThemeColor('white', theme),
      fontSize: 16,
      fontWeight: '600',
      alignSelf: 'center',
    },
    image: {
      width: 48,
      height: 48,
      alignSelf: 'center',
      borderRadius: 24,
    },
    textContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      width: '70%',
      borderRadius: 30,
    },
    userName: {
      color: getThemeColor('text', theme),
      fontSize: 16,
      fontWeight: '600',
    },
    message: {
      color: getThemeColor('textSecondary', theme),
      fontSize: 14,
      marginTop: 2,
    },
    dateView: {justifyContent: 'flex-end', right: 10},
    date: {color: getThemeColor('textSecondary', theme), fontSize: 12},
  });
