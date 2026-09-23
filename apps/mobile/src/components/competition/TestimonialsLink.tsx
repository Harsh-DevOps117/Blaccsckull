import { Pressable, View } from 'react-native';
import { colors } from '../../lib/theme';
import { Card, Icon, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function TestimonialsLink({ t, show }: Pick<LoadedCompetitionState, 't' | 'show'>) {
  return (
    <Pressable accessibilityRole="button" onPress={() => show('testimonials')}>
      <Card style={[ui.row, { paddingHorizontal: 17, paddingVertical: 10 }]}>
        <View style={s.chat}>
          <Icon name="chatbubble-ellipses-outline" color={colors.ink} size={27} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt bold>{t('hear')}</Txt>
          <Txt muted style={{ fontSize: 12 }}>
            {t('feedback')}
          </Txt>
        </View>
        <Icon name="chevron-forward" color={colors.ink} size={18} />
      </Card>
    </Pressable>
  );
}
