import { View } from 'react-native';
import { translate } from '../../lib/i18n';
import { colors } from '../../lib/theme';
import { Card, Icon, Txt } from '../ui';

import { sectionStyles as s } from './sectionStyles';
import type { CompetitionSectionProps as Props } from './types';
export function DatesCard({ data, locale, compact }: Props) {
  const c = data.competition;
  const dates = [
    { label: 'registerBy', value: c.registrationClosesAt, icon: 'calendar-outline' },
    { label: 'starts', value: c.submissionOpensAt, icon: 'paper-plane-outline' },
    { label: 'ends', value: c.submissionClosesAt, icon: 'push-outline' },
    { label: 'result', value: c.resultsAt, icon: 'trophy-outline' },
  ] as const;
  return (
    <Card style={{ padding: compact ? 14 : 18 }}>
      <Txt bold style={{ marginBottom: 10 }}>
        {translate('dates', locale)}
      </Txt>
      <View style={s.dates}>
        {dates.map((d, i) => {
          const date = new Date(d.value);
          return (
            <View
              key={d.label}
              style={[
                s.dateCell,
                { paddingHorizontal: compact ? 10 : 30, gap: compact ? 10 : 22 },
                i % 2 === 0 && { borderRightWidth: 1, borderRightColor: colors.border },
                i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Icon name={d.icon} size={compact ? 25 : 31} />
              <View>
                <Txt muted style={{ fontSize: compact ? 11 : 14 }}>
                  {translate(d.label, locale)}
                </Txt>
                <Txt bold style={{ color: colors.teal, fontSize: compact ? 14 : 17 }}>
                  {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'hi-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                    timeZone: c.timezone,
                  }).format(date)}
                </Txt>
                <Txt bold style={{ fontSize: compact ? 13 : 16 }}>
                  {new Intl.DateTimeFormat('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: c.timezone,
                  }).format(date)}
                </Txt>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
