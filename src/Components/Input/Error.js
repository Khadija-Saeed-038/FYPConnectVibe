import {Text} from 'react-native';
import React from 'react';
import {useThemeColor} from '../../Screens/ThemeProvider/redux/saga';

export default function Error({errors}) {
  const errorColor = useThemeColor('error');

  return (
    <>
      {errors ? (
        <Text style={{color: errorColor, alignSelf: 'flex-start', marginTop: 4}}>
          {errors?.message}
        </Text>
      ) : (
        ''
      )}
    </>
  );
}
