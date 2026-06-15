import {SafeAreaView, StatusBar, Text, View} from 'react-native';
import React from 'react';
import {connect} from 'react-redux';
import {getStyles} from './styles';

const AddScreen = ({theme}) => {
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        animated={true}
        backgroundColor={styles.header.backgroundColor}
        barStyle={'light-content'}
      />
    </SafeAreaView>
  );
};
const mapStateToProps = state => ({
  userDetail: state?.login?.userDetail?.user,
  theme: state?.themes?.theme,
});

export default connect(mapStateToProps, null)(AddScreen);
