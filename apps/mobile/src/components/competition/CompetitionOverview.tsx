import { View } from 'react-native';
import { translate } from '../../lib/i18n';
import { colors, money } from '../../lib/theme';
import { Card, Icon, Txt, styles as ui } from '../ui';

import { sectionStyles as s } from './sectionStyles';
import type { CompetitionSectionProps as Props } from './types';
export function CompetitionOverview({ data, locale, compact }: Props) {
  const t = (key: Parameters<typeof translate>[0]) => translate(key, locale);
  const c = data.competition;
  return (
    <Card style={{ padding: compact ? 16 : 24 }}>
      <View
        style={[
          ui.row,
          { alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
        ]}
      >
        <Txt
          bold
          style={{ fontSize: compact ? 23 : 29, lineHeight: compact ? 30 : 37, flexShrink: 1 }}
        >
          {c.title[locale]}
        </Txt>
        {data.participation && (
          <View style={s.registered}>
            <Icon name="checkmark-circle" size={22} />
            <Txt bold style={{ color: colors.teal, fontSize: compact ? 12 : 15 }}>
              {t(data.participation.status === 'submitted' ? 'submitted' : 'registered')}
            </Txt>
          </View>
        )}
      </View>
      <View style={[ui.row, { marginTop: 10, flexWrap: 'wrap', gap: compact ? 7 : 12 }]}>
        <View style={s.chip}>
          <Txt style={{ fontSize: compact ? 12 : 15 }}>{c.category[locale]}</Txt>
        </View>
        <View style={s.chip}>
          <Txt style={{ fontSize: compact ? 12 : 15 }}>{t('multi')}</Txt>
        </View>
        <Icon name="trophy-outline" size={compact ? 18 : 24} />
        <Txt style={{ color: colors.teal, fontSize: compact ? 12 : 16 }}>{t('certificate')}</Txt>
      </View>
      <View
        style={{
          flexDirection: 'row',
          marginTop: 22,
          gap: 14,
          flexWrap: compact ? 'wrap' : 'nowrap',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Txt muted>{t('pool')}</Txt>
          <Txt bold style={{ fontSize: compact ? 32 : 41, lineHeight: 48, color: colors.teal }}>
            {money(c.prizePool)}
          </Txt>
        </View>
        <View style={{ flex: compact ? 0.8 : 1 }}>
          <Txt muted>{t('fee')}</Txt>
          <Txt bold style={{ fontSize: compact ? 28 : 35, lineHeight: 48 }}>
            {money(c.entryFee)}
          </Txt>
        </View>
        <View style={{ width: compact ? '100%' : '35%', gap: 8 }}>
          <View style={[ui.row, { gap: 8 }]}>
            <Icon name="people-outline" size={20} />
            <Txt style={{ color: colors.teal, fontSize: 16 }}>
              {c.spotsLeft ? `${t('only')} ${c.spotsLeft} ${t('spots')}` : t('noSpots')}
            </Txt>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: c.capacity, now: c.booked }}
            style={s.progress}
          >
            <View
              style={{
                width: `${Math.min(100, (c.booked / c.capacity) * 100)}%`,
                height: 5,
                backgroundColor: colors.teal,
                borderRadius: 4,
              }}
            />
          </View>
          <Txt muted>
            {c.booked} / {c.capacity} {t('booked')}
          </Txt>
        </View>
      </View>
    </Card>
  );
}
