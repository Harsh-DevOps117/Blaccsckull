import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompetitionOverview } from '../components/competition/CompetitionOverview';
import { Countdown } from '../components/competition/Countdown';
import { DatesCard } from '../components/competition/DatesCard';
import { InformationCard } from '../components/competition/InformationCard';
import { JudgeCard } from '../components/competition/JudgeCard';
import { RewardsCard } from '../components/competition/RewardsCard';
import { WinnersCard } from '../components/competition/WinnersCard';
import { Button, Icon, Txt } from '../components/ui';
import { colors } from '../lib/theme';

import { Advertisement } from '../components/competition/Advertisement';
import { AuthenticationDialog } from '../components/competition/AuthenticationDialog';
import { CompetitionDisclaimer } from '../components/competition/CompetitionDisclaimer';
import { CompetitionFooter } from '../components/competition/CompetitionFooter';
import { CompetitionHeader } from '../components/competition/CompetitionHeader';
import { CompetitionVideoDialog } from '../components/competition/CompetitionVideoDialog';
import { ConnectionNotice } from '../components/competition/ConnectionNotice';
import { DiscoveryDialog } from '../components/competition/DiscoveryDialog';
import { PaymentConfirmationDialog } from '../components/competition/PaymentConfirmationDialog';
import { PaymentInfoDialog } from '../components/competition/PaymentInfoDialog';
import { PaymentInformation } from '../components/competition/PaymentInformation';
import { PayoutDialog } from '../components/competition/PayoutDialog';
import { ProfileDialog } from '../components/competition/ProfileDialog';
import { ReferralBanner } from '../components/competition/ReferralBanner';
import { RefundDialog } from '../components/competition/RefundDialog';
import { RegistrationDialog } from '../components/competition/RegistrationDialog';
import { screenStyles as s } from '../components/competition/screenStyles';
import { SubmissionDialog } from '../components/competition/SubmissionDialog';
import { TestimonialsDialog } from '../components/competition/TestimonialsDialog';
import { TestimonialsLink } from '../components/competition/TestimonialsLink';
import { ToastNotification } from '../components/competition/ToastNotification';
import { useCompetitionScreen } from '../hooks/useCompetitionScreen';
export function CompetitionScreen() {
  const state = useCompetitionScreen();
  const {
    data,
    c,
    loading,
    error,
    refreshing,
    refresh,
    t,
    locale,
    compact,
    scroller,
    footerHeight,
    now,
    onVideo,
  } = state;
  if (loading)
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Txt muted>Getting the stage ready…</Txt>
      </SafeAreaView>
    );
  if (!data || !c)
    return (
      <SafeAreaView style={s.center}>
        <Icon name="cloud-offline-outline" size={48} />
        <Txt bold style={{ fontSize: 23 }}>
          We couldn’t load this competition
        </Txt>
        <Txt muted style={{ textAlign: 'center', maxWidth: 360 }}>
          {error || 'Please try again in a moment.'}
        </Txt>
        <Button title={t('retry')} onPress={() => void refresh(true)} busy={refreshing} />
      </SafeAreaView>
    );
  const model = { ...state, data, c };
  const props = { data, locale, compact };
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <ScrollView
        ref={scroller}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh(true)}
            tintColor={colors.teal}
          />
        }
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: footerHeight + 12,
        }}
      >
        <View style={[s.page, { paddingHorizontal: compact ? 14 : 24 }]}>
          <CompetitionHeader {...model} />
          <ConnectionNotice {...model} />
          <CompetitionOverview {...props} />
          <JudgeCard {...props} onVideo={onVideo} />
          <Countdown c={c} now={now} locale={locale} compact={compact} />
          <DatesCard {...props} />
          <WinnersCard {...props} onVideo={onVideo} />
          <InformationCard c={c} locale={locale} compact={compact} />
          <RewardsCard c={c} locale={locale} />
          <CompetitionDisclaimer {...model} />
          <PaymentInformation {...model} />
          <ReferralBanner {...model} />
          <TestimonialsLink {...model} />
          <Advertisement {...model} />
        </View>
      </ScrollView>
      <CompetitionFooter {...model} />
      <ToastNotification {...model} />
      <AuthenticationDialog {...model} />
      <SubmissionDialog {...model} />
      <RegistrationDialog {...model} />
      <RefundDialog {...model} />
      <PayoutDialog {...model} />
      <PaymentInfoDialog {...model} />
      <PaymentConfirmationDialog {...model} />
      <TestimonialsDialog {...model} />
      <ProfileDialog {...model} />
      <DiscoveryDialog {...model} />
      <CompetitionVideoDialog {...model} />
    </SafeAreaView>
  );
}
