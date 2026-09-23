import { Pressable, View } from 'react-native';
import { colors } from '../../lib/theme';
import { Icon, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function ConnectionNotice({
  error,
  refresh,
  t,
}: Pick<LoadedCompetitionState, 'error' | 'refresh' | 't'>) {
  return (
    <>
      {!!error && (
        <View accessibilityRole="alert" style={[ui.error, ui.row]}>
          <Icon name="cloud-offline-outline" color={colors.red} />
          <Txt style={{ flex: 1, fontSize: 13 }}>{error} Showing the last loaded details.</Txt>
          <Pressable onPress={() => void refresh(true)}>
            <Txt bold style={{ color: colors.teal }}>
              {t('retry')}
            </Txt>
          </Pressable>
        </View>
      )}
    </>
  );
}
