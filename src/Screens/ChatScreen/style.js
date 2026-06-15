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
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: getThemeColor('border', theme),
      paddingHorizontal: 20,
      alignItems: 'flex-end',
      paddingBottom: 16,
      flexDirection: 'row',
    },
    searchContainer: {
      width: '85%',
      height: 44,
      borderRadius: 22,
      marginLeft: 10,
    },
    imageDiv: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      color: getThemeColor('headerText', theme),
      fontSize: 18,
      fontWeight: '600',
    },
    imgText: {
      color: getThemeColor('white', theme),
      fontSize: 16,
      fontWeight: '600',
      alignSelf: 'center',
    },
    userName: {
      color: getThemeColor('headerText', theme),
      fontSize: 17,
      fontWeight: '600',
      alignSelf: 'center',
    },
    sentTextHeader: {
      paddingTop: 8,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    sentHeaderView: {
      justifyContent: 'flex-end',
      marginLeft: 20,
      borderRadius: 16,
      marginBottom: 10,
      maxWidth: '65%',
      alignItems: 'flex-end',
    },
    sentText: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      color: getThemeColor('text', theme),
      fontSize: 14,
      fontWeight: '400',
      flexWrap: 'wrap',
    },
    imageContainer: {
      backgroundColor: getThemeColor('buttonColor', theme),
      width: 40,
      height: 40,
      marginHorizontal: 3,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    chatMainHeader: {
      marginHorizontal: 24,
    },
    inputInnerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderRadius: 24,
      marginHorizontal: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: getThemeColor('border', theme),
    },
    leftInputView: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    inputText: {
      fontSize: 15,
      minHeight: 44,
      flex: 1,
      color: getThemeColor('text', theme),
    },
    iconContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    sendBtn: {
      backgroundColor: getThemeColor('buttonColor', theme),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      width: 44,
      height: 44,
    },
  });
