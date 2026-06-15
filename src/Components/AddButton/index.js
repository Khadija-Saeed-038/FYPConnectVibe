import {StyleSheet, Platform, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {shadow, useThemeColor} from '../../Screens/ThemeProvider/redux/saga';

export default function AddButton() {
  const navigation = useNavigation();
  const backgroundColor = useThemeColor('buttonColor');
  const textOnButton = useThemeColor('textOnButton');

  return (
    <View style={[styles.btnContainer, shadow.card, {backgroundColor}]}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('AddUser')}>
        <Text style={[styles.btnText, {color: textOnButton}]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btnContainer: {
    marginBottom: Platform.OS == 'ios' ? 20 : 0,
    position: 'absolute',
    height: 56,
    width: 56,
    borderRadius: 28,
    bottom: 30,
    right: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  btnText: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: -2,
  },
});
