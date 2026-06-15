import {Alert, ActionSheetIOS, Platform} from 'react-native';
import {Toast} from 'react-native-toast-notifications';

/**
 * iOS: free-text via Alert.prompt. Android: predefined reasons (all non-empty).
 */
export function promptReportReason(onDone) {
  if (Platform.OS === 'ios') {
    Alert.prompt(
      'Report',
      'Briefly describe why you are reporting (required).',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit',
          onPress: text => {
            const r = String(text || '').trim();
            if (!r) {
              Toast.show('Please enter a reason');
              return;
            }
            onDone(r);
          },
        },
      ],
      'plain-text',
    );
  } else {
    pickReportReason(onDone);
  }
}

export function showChatSafetyMenu({onReport, onBlock}) {
  const options = ['Report', 'Block', 'Cancel'];
  const cancelIndex = 2;
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: cancelIndex,
        destructiveButtonIndex: 1,
      },
      index => {
        if (index === 0) {
          onReport();
        } else if (index === 1) {
          onBlock();
        }
      },
    );
  } else {
    Alert.alert('Chat options', undefined, [
      {text: 'Report', onPress: onReport},
      {text: 'Block', onPress: onBlock, style: 'destructive'},
      {text: 'Cancel', style: 'cancel'},
    ]);
  }
}

/** Group chat header: Report, Block, Rename (Android uses a two-step alert to stay within button limits). */
export function showGroupChatMenu({onReport, onBlock, onRename}) {
  if (Platform.OS === 'ios') {
    const options = ['Report', 'Block', 'Rename group', 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 3,
        destructiveButtonIndex: 1,
      },
      index => {
        if (index === 0) {
          onReport();
        } else if (index === 1) {
          onBlock();
        } else if (index === 2) {
          onRename();
        }
      },
    );
  } else {
    Alert.alert('Group', 'Choose an action', [
      {
        text: 'Moderation',
        onPress: () => {
          Alert.alert('Moderation', undefined, [
            {text: 'Report', onPress: onReport},
            {text: 'Block', onPress: onBlock, style: 'destructive'},
            {text: 'Cancel', style: 'cancel'},
          ]);
        },
      },
      {text: 'Rename group', onPress: onRename},
      {text: 'Cancel', style: 'cancel'},
    ]);
  }
}

export function pickReportReason(onPick) {
  const reasons = [
    'Spam',
    'Harassment',
    'Scam',
    'Nudity or sexual content',
    'Other',
  ];
  const cancel = 'Cancel';
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...reasons, cancel],
        cancelButtonIndex: reasons.length,
      },
      index => {
        if (index >= 0 && index < reasons.length) {
          onPick(reasons[index]);
        }
      },
    );
  } else {
    Alert.alert('Report reason', undefined, [
      ...reasons.map(r => ({
        text: r,
        onPress: () => onPick(r),
      })),
      {text: cancel, style: 'cancel'},
    ]);
  }
}
