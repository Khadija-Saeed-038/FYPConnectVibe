import {StyleSheet} from 'react-native';

import {getThemeColor, shadow} from '../ThemeProvider/redux/saga';

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
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: getThemeColor('headerText', theme),
    },
    bottomItemView: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: getThemeColor('border', theme),
    },
    leftBottomView: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    bottomText: {
      fontSize: 15,
      fontWeight: '500',
    },
    moreMainView: {
      flex: 1,
      backgroundColor: getThemeColor('cardBackground', theme),
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    iconTile: {
      padding: 12,
      borderRadius: 12,
    },
  });
