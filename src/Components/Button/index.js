import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import {useThemeColor} from '../../Screens/ThemeProvider/redux/saga';

const Button = ({
  containerStyle,
  textStyle,
  text,
  onPress,
  loading,
  disabled,
}) => {
  const buttonColor = useThemeColor('buttonColor');
  const textColor = useThemeColor('textOnButton');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.buttonTouchable,
        {backgroundColor: buttonColor, borderColor: buttonColor},
        containerStyle,
      ]}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, {color: textColor}, textStyle]}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  buttonTouchable: {
    height: 52,
    borderWidth: 0,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
