import {Platform, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import EditProfile from '../Screens/EditProfileScreen';
import Home from '../Screens/HomeScreen';
import Chat from '../Screens/ChatScreen';
import Setting from '../Screens/SettingScreen';
import {useThemeColor} from '../Screens/ThemeProvider/redux/saga';
import {connect} from 'react-redux';
import AddScreen from '../Screens/AddScreen';
import AddUser from '../Screens/NewChat/AddUser';
import CreateGroup from '../Screens/ChatScreen/CreateGroup';
import GroupChat from '../Screens/ChatScreen/GroupChat';
import ChatInfoScreen from '../Screens/ChatScreen/ChatInfoScreen';
import AddGroupMembers from '../Screens/ChatScreen/AddGroupMembers';
import PrivacyScreen from '../Screens/SettingScreen/PrivacyScreen';
import TermAndConditions from '../Screens/TermsandCond';

const AppStack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AppNavigator = ({theme}) => {
  const styles = getStyles(theme);
  const headerBackgroundColor = useThemeColor('headerColor');
  const activeTab = useThemeColor('activeTab');
  const activeTabIcon = useThemeColor('activeTabIcon');
  const tabInactive = useThemeColor('tabInactive');
  const borderColor = useThemeColor('border');

  const tabConfig = [
    {
      name: 'home',
      component: Home,
      focusedIcon: (
        <View
          style={[styles.activeIconContainer, {backgroundColor: activeTab}]}>
          <AntDesign size={22} color={activeTabIcon} name={'home'} />
        </View>
      ),
      defaultIcon: (
        <View style={styles.defaultIcon}>
          <AntDesign size={20} color={tabInactive} name={'home'} />
          <Text style={[styles.tabLabel, {color: tabInactive}]}>Home</Text>
        </View>
      ),
    },
    {
      name: 'setting',
      component: Setting,
      focusedIcon: (
        <View
          style={[styles.activeIconContainer, {backgroundColor: activeTab}]}>
          <AntDesign size={22} color={activeTabIcon} name={'setting'} />
        </View>
      ),
      defaultIcon: (
        <View style={styles.defaultIcon}>
          <AntDesign size={20} color={tabInactive} name={'setting'} />
          <Text style={[styles.tabLabel, {color: tabInactive}]}>
            Settings
          </Text>
        </View>
      ),
    },
  ];
  const TabBarIcon = ({route, focused}) => {
    const tab = tabConfig.find(tab => tab.name === route.name);
    return <>{focused ? tab.focusedIcon : tab.defaultIcon}</>;
  };

  const BottomNavigator = () => {
    return (
      <Tab.Navigator
        initialRouteName="home"
        screenOptions={({route}) => ({
          tabBarPressColor: 'none',
          tabBarInactiveTintColor: tabInactive,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 80 : 70,
            backgroundColor: headerBackgroundColor,
            borderTopColor: borderColor,
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarIconStyle: {
            alignContent: 'center',
            width: 'auto',
          },
          tabBarShowLabel: false,
          headerShown: false,
          tabBarButton: ['home', 'setting'].includes(route.name)
            ? undefined
            : () => {
                return null;
              },
          tabBarIcon: ({focused}) => (
            <TabBarIcon route={route} focused={focused} />
          ),
          tabBarIndicatorStyle: {display: 'none'},
        })}>
        {tabConfig.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
          />
        ))}
      </Tab.Navigator>
    );
  };

  return (
    <AppStack.Navigator
      initialRouteName={'BottomBar'}
      screenOptions={{
        headerShown: false,
      }}>
      <AppStack.Screen name="BottomBar" component={BottomNavigator} />
      <AppStack.Screen name="Chat" component={Chat} />
      <AppStack.Screen name="EditProfile" component={EditProfile} />
      <AppStack.Screen name="AddUser" component={AddUser} />
      <AppStack.Screen name="AddScreen" component={AddScreen} />
      <AppStack.Screen name="CreateGroup" component={CreateGroup} />
      <AppStack.Screen name="GroupChat" component={GroupChat} />
      <AppStack.Screen name="ChatInfo" component={ChatInfoScreen} />
      <AppStack.Screen name="AddGroupMembers" component={AddGroupMembers} />
      <AppStack.Screen name="Privacy" component={PrivacyScreen} />
      <AppStack.Screen name="Term&Cond" component={TermAndConditions} />
    </AppStack.Navigator>
  );
};

export const getStyles = theme =>
  StyleSheet.create({
    activeIconContainer: {
      width: 72,
      alignItems: 'center',
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    defaultIcon: {
      width: 55,
      alignItems: 'center',
      height: 50,
      justifyContent: 'center',
    },
    tabLabel: {
      fontSize: 10,
      marginTop: 2,
      fontWeight: '500',
    },
  });

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
});

export default connect(mapStateToProps, null)(AppNavigator);
