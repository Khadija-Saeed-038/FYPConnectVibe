import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import ImageCropPicker from 'react-native-image-crop-picker';
import {useThemeColor} from '../../Screens/ThemeProvider/redux/saga';
import AntDesign from 'react-native-vector-icons/AntDesign';

const CameraModal = ({
  pictureModalVisible,
  setPictureModalVisible,
  setProfileImage,
}) => {
  const openCamera = () => {
    ImageCropPicker.openCamera({
      width: 300,
      height: 400,
      cropping: true,
    }).then(image => {
      setPictureModalVisible(false);
      setProfileImage(image);
    });
  };

  const openImagePicker = () => {
    ImageCropPicker.openPicker({
      width: 300,
      height: 400,
      cropping: true,
    }).then(image => {
      setPictureModalVisible(false);
      setProfileImage(image);
    });
  };

  const cardBackground = useThemeColor('cardBackground');
  const textColor = useThemeColor('text');
  const borderColor = useThemeColor('border');
  const inputBackground = useThemeColor('inputBackground');

  return (
    <Modal
      animationType={'slide'}
      transparent={true}
      isVisible={pictureModalVisible}
      hasBackdrop={true}
      backdropOpacity={0.4}
      style={styles.modalStyle}
      onRequestClose={() => {
        setPictureModalVisible(false);
      }}
      onBackdropPress={() => setPictureModalVisible(false)}>
      <View
        style={[
          styles.pictureModalView,
          {backgroundColor: cardBackground, borderTopColor: borderColor},
        ]}>
        <TouchableOpacity
          style={styles.iconTouchable}
          onPress={openImagePicker}>
          <View
            style={[
              styles.iconView,
              {backgroundColor: inputBackground, borderColor},
            ]}>
            <AntDesign name="picture" size={24} color={textColor} />
          </View>
          <Text style={[styles.galleryAndCameraTxt, {color: textColor}]}>
            Gallery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconTouchable} onPress={openCamera}>
          <View
            style={[
              styles.iconView,
              {backgroundColor: inputBackground, borderColor},
            ]}>
            <AntDesign name="camera" size={24} color={textColor} />
          </View>
          <Text style={[styles.galleryAndCameraTxt, {color: textColor}]}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default CameraModal;

const styles = StyleSheet.create({
  modalStyle: {
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    justifyContent: 'flex-end',
  },
  pictureModalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 24,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  iconView: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 18,
  },
  iconTouchable: {
    alignItems: 'center',
  },
  galleryAndCameraTxt: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
});
