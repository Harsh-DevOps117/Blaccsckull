import { Pressable, View } from 'react-native';
import { money } from '../../lib/theme';
import { Icon, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { NavItem } from './NavItem';
import { screenStyles as s } from './screenStyles';
export function CompetitionFooter({
  data,
  user,
  now,
  setToast,
  setFooterHeight,
  compact,
  insets,
  scroller,
  t,
  c,
  show,
  act,
}: Pick<
  LoadedCompetitionState,
  | 'data'
  | 'user'
  | 'now'
  | 'setToast'
  | 'setFooterHeight'
  | 'compact'
  | 'insets'
  | 'scroller'
  | 't'
  | 'c'
  | 'show'
  | 'act'
>) {
  const expiredAction =
    data.action.type === 'register'
      ? now >= Date.parse(c.registrationClosesAt) || now < Date.parse(c.registrationOpensAt)
      : data.action.type === 'upload'
        ? now >= Date.parse(c.submissionClosesAt) || now < Date.parse(c.submissionOpensAt)
        : false;
  const disabled = data.action.type === 'disabled' || expiredAction;
  const actionTitle = expiredAction
    ? t('closed')
    : data.action.type === 'register'
      ? `${t('register')} · ${money(c.entryFee)}`
      : data.action.type === 'upload'
        ? t(data.participation?.submission ? 'update' : 'upload')
        : data.action.label;
  return (
    <View
      onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      style={[s.footerContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}
    >
      <View style={[s.footer, { paddingHorizontal: compact ? 14 : 24 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionTitle}
          accessibilityState={{ disabled }}
          onPress={act}
          disabled={disabled}
          style={[s.cta, disabled && { backgroundColor: '#A3B7BC' }]}
        >
          <Txt bold style={{ color: 'white', fontSize: compact ? 16 : 18, textAlign: 'center' }}>
            {actionTitle}
          </Txt>
          {data.participation && (
            <Txt style={{ color: 'white', fontSize: 14, lineHeight: 18 }}>
              {t(data.participation.status === 'submitted' ? 'submitted' : 'registered')}
            </Txt>
          )}
        </Pressable>
        <View style={s.nav}>
          <NavItem compact={compact} name="home" label={t('home')} onPress={() => show('home')} />
          <NavItem
            compact={compact}
            name="search-outline"
            label={t('explore')}
            onPress={() => show('browse')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create submission"
            onPress={() => {
              if (data.action.type === 'upload') act();
              else if (!user) show('auth');
              else setToast('Register for an open competition to submit your performance.');
            }}
            style={({ pressed }) => [s.add, compact && s.addCompact, pressed && { opacity: 0.8 }]}
          >
            <Icon name="add-circle" size={compact ? 37 : 43} color="white" />
          </Pressable>
          <NavItem
            compact={compact}
            name="trophy"
            label={t('competitions')}
            active
            onPress={() => scroller.current?.scrollTo({ y: 0, animated: true })}
          />
          <NavItem
            compact={compact}
            name="person-circle"
            label={t('profile')}
            onPress={() => show(user ? 'profile' : 'auth')}
          />
        </View>
      </View>
    </View>
  );
}
