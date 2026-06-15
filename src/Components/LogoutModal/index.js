import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {logout as logoutAction} from '../../Screens/LoginScreen/redux/actions';
import {connect} from 'react-redux';
import {
  getThemeColor,
  shadow,
  useThemeColor,
} from '../../Screens/ThemeProvider/redux/saga';

const Logout = ({
  isLogOutModelVisible,
  setIsLogOutModalVisible,
  logoutAction,
  theme,
}) => {
  const styles = getStyles(theme);

  const cardBackground = useThemeColor('cardBackground');
  const textColor = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const buttonColor = useThemeColor('buttonColor');
  const borderColor = useThemeColor('border');
  const textOnButton = useThemeColor('textOnButton');

  return (
    <Modal
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.4}
      isVisible={isLogOutModelVisible}
      style={styles.addModalContainer}
      hasBackdrop={true}
      onBackdropPress={() => setIsLogOutModalVisible(false)}>
      <View
        style={[
          styles.ModalContainer,
          shadow.card,
          {backgroundColor: cardBackground},
        ]}>
        <View style={styles.modalTextContainer}>
          <Text style={[styles.titleText, {color: textColor}]}>Logout</Text>
          <Text style={[styles.descriptionText, {color: textSecondary}]}>
            Are you sure you want to logout?
          </Text>
        </View>
        <View style={styles.btnView}>
          <TouchableOpacity
            onPress={() => setIsLogOutModalVisible(false)}
            style={[styles.cancelView, {borderColor}]}>
            <Text style={[styles.cancelText, {color: textColor}]}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteView, {backgroundColor: buttonColor}]}
            onPress={() => logoutAction()}>
            <Text style={[styles.DeleteText, {color: textOnButton}]}>Yes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const getStyles = theme =>
  StyleSheet.create({
    addModalContainer: {
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 24,
    },
    ModalContainer: {
      alignItems: 'center',
      borderRadius: 16,
      width: '100%',
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 20,
    },
    modalTextContainer: {
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    titleText: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    descriptionText: {
      fontSize: 15,
      fontWeight: '400',
      textAlign: 'center',
      lineHeight: 22,
    },
    btnView: {
      alignContent: 'center',
      justifyContent: 'space-between',
      flexDirection: 'row',
      marginTop: 24,
      gap: 12,
    },
    cancelView: {
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      height: 48,
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
    },
    deleteView: {
      borderRadius: 12,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
    },
    DeleteText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });

const mapStateToProps = state => ({
  theme: state?.themes?.theme,
});
const mapDispatchToProps = dispatch => ({
  logoutAction: () => dispatch(logoutAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Logout);
