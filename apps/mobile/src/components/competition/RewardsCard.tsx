import { View } from 'react-native';
import { translate } from '../../lib/i18n';
import { colors, money, ordinal } from '../../lib/theme';
import type { Competition, Locale } from '../../lib/types';
import { Card, Icon, Txt, styles as ui } from '../ui';

import { sectionStyles as s } from './sectionStyles';
export function RewardsCard({ c, locale }: { c: Competition; locale: Locale }) {
  return (
    <Card style={{ paddingHorizontal: 22, paddingVertical: 14 }}>
      <View style={[ui.row, { marginBottom: 8 }]}>
        <Txt bold>{translate('rewards', locale)}</Txt>
        <Txt muted>({translate('positions', locale)})</Txt>
      </View>
      <View style={{ gap: 4 }}>
        {c.rewards.map((r) => (
          <View key={r.position} style={s.reward}>
            <View style={{ width: 40, alignItems: 'center' }}>
              {r.position <= 3 ? (
                <Txt style={{ fontSize: 24, lineHeight: 28 }}>
                  {['🏆', '🥈', '🥉'][r.position - 1]}
                </Txt>
              ) : (
                <Icon name="star-outline" size={23} />
              )}
            </View>
            <Txt bold style={{ flex: 1 }}>
              {ordinal(r.position)} {translate('winner', locale)}
            </Txt>
            <Txt bold style={{ color: colors.teal, fontSize: 21 }}>
              {money(r.amount)}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  );
}
