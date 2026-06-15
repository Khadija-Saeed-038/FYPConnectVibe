import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useThemeColor} from '../Screens/ThemeProvider/redux/saga';

/**
 * WhatsApp-style double-check: gray = sent, blue = read.
 * @param {{ status: 'sent' | 'read', size?: number }} props
 */
const MessageTicks = ({status, size = 14}) => {
  const textSecondary = useThemeColor('textSecondary');
  const buttonColor = useThemeColor('buttonColor');
  const color = status === 'read' ? buttonColor : textSecondary;

  return <Ionicons name="checkmark-done" size={size} color={color} />;
};

export default MessageTicks;
