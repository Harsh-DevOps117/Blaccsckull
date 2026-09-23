import { Pressable, View } from 'react-native';
import { colors, money } from '../../lib/theme';
import { Button, Icon, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function ReferralBanner({
  locale,
  copied,
  referral,
  compact,
  t,
  c,
  share,
}: Pick<
  LoadedCompetitionState,
  'locale' | 'copied' | 'referral' | 'compact' | 't' | 'c' | 'share'
>) {
  return (
    <View style={[s.referral, compact && { flexWrap: 'wrap', padding: 16, gap: 12 }]}>
      <Icon name="megaphone-outline" size={compact ? 36 : 49} color="#45BCA2" />
      <View style={{ flex: 1, gap: 7, minWidth: compact ? 230 : 0 }}>
        <Txt bold style={{ fontSize: 17 }}>
          {t('refer')}
        </Txt>
        <View style={s.copyBox}>
          <Txt numberOfLines={1} style={{ flex: 1, fontSize: 13, color: colors.teal }}>
            {referral?.referralLink ??
              (locale === 'en'
                ? 'Sign in to get your referral link'
                : 'रेफरल लिंक के लिए साइन इन करें')}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('copy')}
            onPress={() => void share(true)}
            style={s.copyButton}
          >
            <Txt bold style={{ fontSize: 13, color: colors.teal }}>
              {t(copied ? 'copied' : 'copy')}
            </Txt>
          </Pressable>
        </View>
      </View>
      <View style={{ gap: 4, width: compact ? '100%' : 220 }}>
        <Button
          title={t('referNow')}
          onPress={() => void share()}
          style={{ minHeight: 35, paddingVertical: 6 }}
        />
        <Txt
          style={{
            color: colors.teal,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          {t('earn')}{' '}
          <Txt bold style={{ color: colors.teal }}>
            {money(c.referralReward)}
          </Txt>{' '}
          {t('signup')}
        </Txt>
      </View>
    </View>
  );
}
