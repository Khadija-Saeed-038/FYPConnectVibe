import {Image, SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import React from 'react';
import {useImages} from '../Utils/Images';
import {useThemeColor} from './ThemeProvider/redux/saga';

export default function SplashScreen() {
  const {images} = useImages();
  const backgroundColor = useThemeColor('primary');

  return (
    <SafeAreaView style={[styles.main, {backgroundColor}]}>
      <StatusBar
        animated={true}
        backgroundColor={backgroundColor}
        barStyle={'dark-content'}
      />
      <Image source={images.appLogo} style={styles.logo} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {width: 250, height: 215},
});
