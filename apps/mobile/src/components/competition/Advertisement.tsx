import { View } from 'react-native';
import { colors } from '../../lib/theme';
import { Icon, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function Advertisement({ t }: Pick<LoadedCompetitionState, 't'>) {
  return (
    <View style={s.ad}>
      <Icon name="megaphone-outline" color={colors.muted} size={22} />
      <Txt muted>{t('ad')}</Txt>
    </View>
  );
}
