import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {useThemeColor} from '../../Screens/ThemeProvider/redux/saga';

const Input = props => {
  const {
    secureTextEntry,
    placeholder,
    onBlur,
    onChangeText,
    value,
    error,
    containerStyle,
    numberOfLines,
    maxLength,
    textAlign,
    multiline,
    keyboardType,
    editable,
    showPassword,
    placeholderColor,
  } = props;

  const textColor = useThemeColor('text');
  const errorColor = useThemeColor('error');
  const defaultPlaceholder = useThemeColor('placeholder');

  return (
    <>
      <View style={[styles.main, containerStyle]}>
        <TextInput
          style={[styles.input, {color: textColor}]}
          placeholder={placeholder}
          editable={editable}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical="top"
          placeholderTextColor={placeholderColor || defaultPlaceholder}
          secureTextEntry={secureTextEntry && !showPassword}
          value={value}
          onBlur={onBlur}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          textAlign={textAlign}
        />
      </View>
      {error ? (
        <Text style={{color: errorColor, alignSelf: 'flex-start'}}>{error}</Text>
      ) : (
        ''
      )}
    </>
  );
};

export default Input;

const styles = StyleSheet.create({
  main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  input: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
});
