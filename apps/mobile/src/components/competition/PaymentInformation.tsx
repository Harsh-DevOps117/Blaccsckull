import { Pressable, View } from 'react-native';
import { colors } from '../../lib/theme';
import { Card, Icon, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function PaymentInformation({
  compact,
  t,
  show,
}: Pick<LoadedCompetitionState, 'compact' | 't' | 'show'>) {
  return (
    <View style={{ flexDirection: compact ? 'column' : 'row', gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="How will you receive prize money?"
        onPress={() => show('payout')}
        style={{ flex: 0.95 }}
      >
        <Card style={[ui.row, { height: 92, padding: 16, gap: 22 }]}>
          <View style={s.payoutPlay}>
            <Icon name="play-circle" size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt bold style={{ lineHeight: 19 }}>
              {t('prizeQuestion')}
            </Txt>
            <Txt muted style={{ fontSize: 13, marginTop: 5 }}>
              {t('watch')}
            </Txt>
          </View>
        </Card>
      </Pressable>
      <Card style={{ flex: 1.45, padding: 12, gap: 9 }}>
        <Pressable accessibilityRole="button" onPress={() => show('refund')} style={ui.row}>
          <Icon name="shield-checkmark-outline" color={colors.ink} size={26} />
          <Txt style={{ fontSize: 14 }}>{t('refund')}</Txt>
          <Icon name="chevron-forward" size={14} color={colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('payments')}
          style={[ui.row, { flexWrap: 'wrap' }]}
        >
          <Icon name="shield-checkmark-outline" color={colors.ink} size={26} />
          <Txt style={{ fontSize: 13 }}>Simulated payment</Txt>
          <Txt
            bold
            style={{
              fontStyle: 'italic',
              color: '#0A2971',
              fontSize: 17,
            }}
          >
            Simulated
          </Txt>
        </Pressable>
      </Card>
    </View>
  );
}
