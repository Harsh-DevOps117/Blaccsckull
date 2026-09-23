import { View } from 'react-native';
import { colors } from '../../lib/theme';
import { Icon, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function CompetitionDisclaimer({
  compact,
  t,
}: Pick<LoadedCompetitionState, 'compact' | 't'>) {
  return (
    <View style={s.disclaimer}>
      <Icon name="information-circle-outline" size={23} />
      <Txt style={{ flex: 1, fontSize: compact ? 12 : 14 }}>
        <Txt bold style={{ color: colors.teal, fontSize: compact ? 12 : 14 }}>
          {t('disclaimer')}{' '}
        </Txt>
        {t('disclaimerText')}
      </Txt>
    </View>
  );
}
