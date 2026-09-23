import { View } from 'react-native';
import { translate } from '../../lib/i18n';
import { colors } from '../../lib/theme';
import type { Competition, Locale } from '../../lib/types';
import { Icon, Txt, styles as ui } from '../ui';

import { sectionStyles as s } from './sectionStyles';
export function Countdown({
  c,
  now,
  locale,
  compact,
}: {
  c: Competition;
  now: number;
  locale: Locale;
  compact: boolean;
}) {
  const beforeOpen = now < Date.parse(c.registrationOpensAt);
  const beforeClose = now < Date.parse(c.registrationClosesAt);
  const beforeSubmitClose = now < Date.parse(c.submissionClosesAt);
  const target = beforeOpen
    ? c.registrationOpensAt
    : beforeClose
      ? c.registrationClosesAt
      : beforeSubmitClose
        ? c.submissionClosesAt
        : c.resultsAt;
  const seconds = Math.max(0, Math.floor((Date.parse(target) - now) / 1000));
  const pad = (v: number) => String(v).padStart(2, '0');
  const time = `${pad(Math.floor(seconds / 86400))}d : ${pad(Math.floor(seconds / 3600) % 24)}h : ${pad(Math.floor(seconds / 60) % 60)}m : ${pad(seconds % 60)}s`;
  const finished = !seconds || c.lifecycle === 'cancelled';
  return (
    <View style={[s.countdown, compact && { flexWrap: 'wrap', gap: 6, paddingHorizontal: 14 }]}>
      <Icon name="hourglass-outline" size={compact ? 22 : 26} />
      <Txt bold style={{ fontSize: compact ? 13 : 15, flex: 1 }}>
        {finished
          ? locale === 'hi'
            ? 'प्रतियोगिता की स्थिति'
            : 'Competition status'
          : translate(
              beforeOpen
                ? 'opens'
                : beforeClose
                  ? 'closes'
                  : beforeSubmitClose
                    ? 'submissionCloses'
                    : 'resultsIn',
              locale,
            )}
      </Txt>
      <Txt bold style={{ color: colors.teal, fontSize: compact ? 17 : 23, lineHeight: 29 }}>
        {finished ? c.lifecycle.replaceAll('_', ' ') : time}
      </Txt>
      {!compact && !finished && (
        <View style={[ui.row, { marginLeft: 55 }]}>
          <Icon name="timer-outline" size={27} />
          <Txt bold style={{ color: colors.teal }}>
            {translate('hurry', locale)}
          </Txt>
        </View>
      )}
    </View>
  );
}
