import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import AppNavigator from './AppStack';
import AuthNavigator from './AuthStack';
import navigationService from './NavigationService';
import {connect} from 'react-redux';

const RootNavigator = ({userDetail}) => {
  const ACCESS_TOKEN = userDetail?.token;
  return (
    <NavigationContainer ref={(ref) => navigationService.setTopLevelNavigator(ref)}>
      {ACCESS_TOKEN ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
const mapStateToProps = state => ({
  userDetail: state.login.userDetail,
});

export default connect(mapStateToProps, null)(RootNavigator);
