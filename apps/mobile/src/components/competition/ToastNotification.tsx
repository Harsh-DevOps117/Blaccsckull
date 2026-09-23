import { Pressable, View } from 'react-native';
import { Icon, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function ToastNotification({
  toast,
  setToast,
  footerHeight,
}: Pick<LoadedCompetitionState, 'toast' | 'setToast' | 'footerHeight'>) {
  return (
    <>
      {!!toast && (
        <View accessibilityRole="alert" style={[s.toast, { bottom: footerHeight + 12 }]}>
          <Icon name="checkmark-circle" color="white" />
          <Txt style={{ color: 'white', flex: 1 }}>{toast}</Txt>
          <Pressable accessibilityLabel="Dismiss notification" onPress={() => setToast('')}>
            <Icon name="close" color="white" size={18} />
          </Pressable>
        </View>
      )}
    </>
  );
}
