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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      alignItems: 'flex-end',
      paddingBottom: 16,
      flexDirection: 'row',
    },
    headerTitle: {
      color: getThemeColor('headerText', theme),
      fontSize: 18,
      fontWeight: '600',
    },
  });
