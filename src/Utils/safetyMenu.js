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

/** Group chat header: Report, Block, optional Rename (admin), optional Leave. */
export function showGroupChatMenu({onReport, onBlock, onRename, onLeave}) {
  const options = ['Report', 'Block'];
  const handlers = [onReport, onBlock];

  if (onRename) {
    options.push('Rename group');
    handlers.push(onRename);
  }
  if (onLeave) {
    options.push('Leave group');
    handlers.push(onLeave);
  }
  options.push('Cancel');
  const cancelIndex = options.length - 1;
  const leaveIndex = onLeave ? options.indexOf('Leave group') : -1;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: cancelIndex,
        destructiveButtonIndex: leaveIndex >= 0 ? leaveIndex : 1,
      },
      index => {
        if (index >= 0 && index < handlers.length) {
          handlers[index]();
        }
      },
    );
  } else {
    const moderationButtons = [
      {text: 'Report', onPress: onReport},
      {text: 'Block', onPress: onBlock, style: 'destructive'},
      {text: 'Cancel', style: 'cancel'},
    ];
    const actionButtons = [{text: 'Cancel', style: 'cancel'}];
    if (onRename) {
      actionButtons.unshift({text: 'Rename group', onPress: onRename});
    }
    if (onLeave) {
      actionButtons.unshift({
        text: 'Leave group',
        onPress: onLeave,
        style: 'destructive',
      });
    }

    Alert.alert('Group', 'Choose an action', [
      {
        text: 'Moderation',
        onPress: () => {
          Alert.alert('Moderation', undefined, moderationButtons);
        },
      },
      ...actionButtons.filter(b => b.text !== 'Cancel'),
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
