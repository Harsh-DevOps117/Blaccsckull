import { Pressable, View } from 'react-native';
import { colors } from '../../lib/theme';
import { Icon, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function CompetitionHeader({
  locale,
  setLocale,
  compact,
  t,
  show,
}: Pick<LoadedCompetitionState, 'locale' | 'setLocale' | 'compact' | 't' | 'show'>) {
  return (
    <View style={s.header}>
      <Pressable accessibilityRole="button" onPress={() => show('browse')} style={ui.row}>
        <Icon name="arrow-back" color={colors.ink} size={28} />
        <Txt bold style={{ fontSize: compact ? 19 : 23 }}>
          {t('back')}
        </Txt>
      </Pressable>
      <View style={s.languages}>
        {(['en', 'hi'] as const).map((l) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={l === 'en' ? 'English' : 'हिंदी'}
            accessibilityState={{ selected: locale === l }}
            key={l}
            onPress={() => setLocale(l)}
            style={[s.language, locale === l && { backgroundColor: colors.teal }]}
          >
            <Txt bold style={{ color: locale === l ? 'white' : colors.ink }}>
              {l === 'en' ? 'ENG' : 'हिंदी'}
            </Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
