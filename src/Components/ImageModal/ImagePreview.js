import {StyleSheet, Text, View, Modal, TouchableOpacity, Image} from 'react-native';
import React from 'react';
import ImageViewer from 'react-native-image-zoom-viewer';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function ImagePreview({preview,setPreview,imageList}) {
  return (
    <Modal visible={preview}>
      <ImageViewer
        imageUrls={imageList}
        onCancel={() => setPreview(false)}
        renderHeader={() => (
          <TouchableOpacity
            onPress={() => setPreview(false)}
            style={{
              marginHorizontal: 10,
              marginVertical: 10,
              marginTop: Platform.OS == 'ios' ? 50 : 0,
              width: 30,
              height: 33,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Ionicons size={25} color={'white'} name={'arrow-back'} />
          </TouchableOpacity>
        )}
        renderImage={({source}) => {
          return (
            <Image
              source={{uri: source.uri}}
              style={{
                bottom: Platform.OS == 'ios' ? 50 : 0,
                width: '100%',
                height: '100%',
              }}
            />
          );
        }}
        backgroundColor="black"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({});
