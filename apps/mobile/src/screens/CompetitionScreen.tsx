import { openCheckout } from '../lib/checkout';
import type { CheckoutOrder } from '../lib/checkout.types';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthModal } from '../components/AuthModal';
import {
  CompetitionOverview,
  Countdown,
  DatesCard,
  InformationCard,
  JudgeCard,
  RewardsCard,
  WinnersCard,
} from '../components/CompetitionSections';
import { Button, Card, Icon, Sheet, Txt, styles as ui } from '../components/ui';
import { UploadModal } from '../components/UploadModal';
import { VideoModal } from '../components/VideoModal';
import { useCompetition } from '../hooks/useCompetition';
import { api } from '../lib/api';
import { translate, type Label } from '../lib/i18n';
import { colors, font, money } from '../lib/theme';
import type { Competition, Locale } from '../lib/types';

type ModalName =
  | 'auth'
  | 'register'
  | 'upload'
  | 'refund'
  | 'payout'
  | 'testimonials'
  | 'profile'
  | 'browse'
  | 'referral'
  | 'payments'
  | null;
type Video = { title: string; url: string; privateVideo?: boolean };

export function CompetitionScreen() {
  const [slug, setSlug] = useState('feedants-classical-dance');
  const state = useCompetition(slug);
  const { data, user, loading, error, now, refreshing, refresh, authenticate, signOut } = state;

  const [locale, setLocale] = useState<Locale>('en');
  const [modal, setModal] = useState<ModalName>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const [footerHeight, setFooterHeight] = useState(155);
  const [copied, setCopied] = useState(false);
  const [referral, setReferral] = useState<{
    referralLink: string;
    referralCount: number;
  } | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [listError, setListError] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const t = (key: Label) => translate(key, locale);
  const c = data?.competition;
  const boundary = useRef('');
  useEffect(() => {
    if (!c) return;
    const key = [
      c.registrationOpensAt,
      c.registrationClosesAt,
      c.submissionOpensAt,
      c.submissionClosesAt,
      c.resultsAt,
    ]
      .map((d) => (now >= Date.parse(d) ? '1' : '0'))
      .join('');
    if (boundary.current && boundary.current !== key) void refresh();
    boundary.current = key;
  }, [now, c, refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);
  useEffect(() => {
    if (!user) {
      setReferral(null);
      return;
    }
    api<{ referralLink: string; referralCount: number }>('/auth/me')
      .then(setReferral)
      .catch(() => {});
  }, [user]);
  useEffect(() => {
    if (modal !== 'browse') return;
    setListLoading(true);
    setListError('');
    api<{ competitions: Competition[] }>('/competitions')
      .then((r) => setCompetitions(r.competitions))
      .catch((e) => setListError(e.message))
      .finally(() => setListLoading(false));
  }, [modal]);
  const show = (value: ModalName) => {
    setActionError('');
    setModal(value);
  };
  const onVideo = (title: string, url: string) => setVideo({ title, url });
  const act = () => {
    if (!user) {
      show('auth');
      return;
    }
    if (data?.action.type === 'upload') show('upload');
    if (data?.action.type === 'register') show('register');
  };
  const register = async () => {
    if (!c) return;
    setBusy(true);
    setActionError('');
    try {
      if (data?.paymentMode === 'razorpay' && c.entryFee > 0) {
        const order = await api<CheckoutOrder | { registered: true }>(
          `/competitions/${c.slug}/payments/order`,
          { method: 'POST', body: '{}' },
        );
        if (!order.registered) {
          const result = await openCheckout(order);
          await api(`/competitions/${c.slug}/payments/verify`, {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id: result.razorpay_order_id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
            }),
          });
        }
      } else {
        await api(`/competitions/${c.slug}/register`, {
          method: 'POST',
          body: JSON.stringify({ acceptDemoPayment: true }),
        });
      }
      await refresh();
      setModal(null);
      setToast(
        locale === 'en'
          ? 'You’re registered! Your stage is waiting.'
          : 'पंजीकरण सफल! मंच आपका इंतज़ार कर रहा है।',
      );
    } catch (e) {
      setActionError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const share = async (copy = false) => {
    if (!user) {
      show('auth');
      return;
    }
    try {
      const details =
        referral ?? (await api<{ referralLink: string; referralCount: number }>('/auth/me'));
      setReferral(details);
      if (copy) {
        await Clipboard.setStringAsync(details.referralLink);
        setCopied(true);
        return;
      }
      if (Platform.OS === 'web' && !navigator.share) {
        await Clipboard.setStringAsync(details.referralLink);
        setToast('Referral link copied. Share it with a friend!');
      } else
        await Share.share({
          message: `Join me on Feedants and share your talent! ${details.referralLink}`,
        });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setToast((e as Error).message);
    }
  };
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
  const props = { data, locale, compact };
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
          {!!error && (
            <View accessibilityRole="alert" style={[ui.error, ui.row]}>
              <Icon name="cloud-offline-outline" color={colors.red} />
              <Txt style={{ flex: 1, fontSize: 13 }}>{error} Showing the last loaded details.</Txt>
              <Pressable onPress={() => void refresh(true)}>
                <Txt bold style={{ color: colors.teal }}>
                  {t('retry')}
                </Txt>
              </Pressable>
            </View>
          )}
          <CompetitionOverview {...props} />
          <JudgeCard {...props} onVideo={onVideo} />
          <Countdown c={c} now={now} locale={locale} compact={compact} />
          <DatesCard {...props} />
          <WinnersCard {...props} onVideo={onVideo} />
          <InformationCard c={c} locale={locale} compact={compact} />
          <RewardsCard c={c} locale={locale} />
          <View style={s.disclaimer}>
            <Icon name="information-circle-outline" size={23} />
            <Txt style={{ flex: 1, fontSize: compact ? 12 : 14 }}>
              <Txt bold style={{ color: colors.teal, fontSize: compact ? 12 : 14 }}>
                {t('disclaimer')}{' '}
              </Txt>
              {t('disclaimerText')}
            </Txt>
          </View>
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
                <Txt style={{ fontSize: 13 }}>{t('payments')}</Txt>
                <Txt
                  bold
                  style={{
                    fontStyle: 'italic',
                    color: '#0A2971',
                    fontSize: 17,
                  }}
                >
                  ϟRazorpay
                </Txt>
              </Pressable>
            </Card>
          </View>
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
          <View style={s.ad}>
            <Icon name="megaphone-outline" color={colors.muted} size={22} />
            <Txt muted>{t('ad')}</Txt>
          </View>
        </View>
      </ScrollView>
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
            <NavItem
              compact={compact}
              name="home"
              label={t('home')}
              onPress={() => show('browse')}
            />
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
      {!!toast && (
        <View accessibilityRole="alert" style={[s.toast, { bottom: footerHeight + 12 }]}>
          <Icon name="checkmark-circle" color="white" />
          <Txt style={{ color: 'white', flex: 1 }}>{toast}</Txt>
          <Pressable accessibilityLabel="Dismiss notification" onPress={() => setToast('')}>
            <Icon name="close" color="white" size={18} />
          </Pressable>
        </View>
      )}
      {modal === 'auth' && (
        <AuthModal onClose={() => setModal(null)} onAuthenticated={authenticate} />
      )}
      {modal === 'upload' && (
        <UploadModal
          slug={c.slug}
          existingTitle={data.participation?.submission?.title}
          onClose={() => setModal(null)}
          onSuccess={async () => {
            await refresh();
            setToast('Your performance was submitted successfully.');
          }}
        />
      )}
      {modal === 'register' && (
        <Sheet title="Take your spot on the stage" onClose={busy ? () => {} : () => setModal(null)}>
          <Txt bold style={{ fontSize: 20 }}>
            {c.title[locale]}
          </Txt>
          <View style={s.summary}>
            <Txt>Entry fee</Txt>
            <Txt bold style={{ color: colors.teal, fontSize: 25 }}>
              {money(c.entryFee)}
            </Txt>
          </View>
          <Txt muted>
            {c.spotsLeft} spots remaining. Your registration is confirmed only after a spot is
            successfully reserved.
          </Txt>
          <View style={s.demoNote}>
            <Icon name="flask-outline" />
            <Txt style={{ flex: 1 }}>
              {c.entryFee === 0
                ? 'This competition is free to enter.'
                : data.paymentMode === 'razorpay'
                  ? data.paymentTestMode
                    ? 'Razorpay test checkout — use test payment details. No real money is charged.'
                    : 'Complete your secure payment with Razorpay. Registration is confirmed after payment verification.'
                  : 'Demo checkout — Razorpay keys are not configured. No money will be charged; a simulated payment will be recorded.'}
            </Txt>
          </View>
          <Txt muted style={{ fontSize: 13 }}>
            By registering you agree to the competition rules and refund policy.
          </Txt>
          {!!actionError && (
            <View style={ui.error}>
              <Txt style={{ color: colors.red }}>{actionError}</Txt>
            </View>
          )}
          <Button
            title={
              c.entryFee === 0
                ? 'Confirm free registration'
                : data.paymentMode === 'razorpay'
                  ? `Pay ${money(c.entryFee)} with Razorpay`
                  : data.paymentMode === 'demo'
                    ? 'Confirm demo registration'
                    : 'Payments are unavailable'
            }
            onPress={register}
            busy={busy}
            disabled={data.paymentMode === 'disabled' && c.entryFee > 0}
          />
        </Sheet>
      )}
      {modal === 'refund' && (
        <Sheet title={t('refund')} onClose={() => setModal(null)}>
          <Icon name="shield-checkmark-outline" size={42} />
          <Txt>{c.refundPolicy[locale]}</Txt>
        </Sheet>
      )}
      {modal === 'payout' && (
        <Sheet title={t('prizeQuestion').replace('\n', ' ')} onClose={() => setModal(null)}>
          <Icon name="trophy-outline" size={42} />
          <Txt>{c.payoutInfo[locale]}</Txt>
          <Button
            title={t('watch')}
            onPress={() => {
              setModal(null);
              onVideo('Prize money explained', c.payoutVideoUrl);
            }}
          />
        </Sheet>
      )}
      {modal === 'payments' && (
        <Sheet title="Payment information" onClose={() => setModal(null)}>
          <Txt>
            {data.paymentMode === 'razorpay'
              ? `Payments are processed by Razorpay${data.paymentTestMode ? ' in test mode (no real money is charged)' : ''}. Your registration is confirmed only after the server verifies the captured payment.`
              : data.paymentMode === 'demo'
                ? 'Razorpay keys are missing, so simulated checkout is available. No real money is charged.'
                : 'Payments are currently disabled.'}
          </Txt>
          <Txt muted>
            If checkout is interrupted, retry registration to check the existing order. If the
            competition fills up during payment, a full refund is requested. Provider errors never
            switch to simulated checkout.
          </Txt>
        </Sheet>
      )}
      {modal === 'testimonials' && (
        <Sheet title={t('hear')} onClose={() => setModal(null)}>
          {c.testimonials.map((item) => (
            <Card key={item.name} style={{ gap: 10 }}>
              <View style={ui.row}>
                {Array.from({ length: item.rating }, (_, i) => (
                  <Icon key={i} name="star" color="#E6AB2D" size={18} />
                ))}
              </View>
              <Txt>“{item.quote[locale]}”</Txt>
              <Txt bold>{item.name}</Txt>
            </Card>
          ))}
        </Sheet>
      )}
      {modal === 'profile' && user && (
        <Sheet title={t('profile')} onClose={() => setModal(null)}>
          <View style={ui.row}>
            <View style={s.avatar}>
              <Txt bold style={{ fontSize: 27, color: colors.teal }}>
                {user.name[0]}
              </Txt>
            </View>
            <View>
              <Txt bold style={{ fontSize: 21 }}>
                {user.name}
              </Txt>
              <Txt muted>{user.email}</Txt>
            </View>
          </View>
          <Card>
            <Txt bold>{c.title[locale]}</Txt>
            <Txt muted>
              {data.participation
                ? t(data.participation.status === 'submitted' ? 'submitted' : 'registered')
                : 'You haven’t registered yet'}
            </Txt>
            {data.participation?.submission && (
              <>
                <Txt style={{ marginTop: 12 }}>{data.participation.submission.title}</Txt>
                <Button
                  title="View my submission"
                  secondary
                  style={{ marginTop: 12 }}
                  onPress={() => {
                    setModal(null);
                    setVideo({
                      title: data.participation!.submission!.title,
                      url: data.participation!.submission!.videoUrl,
                      privateVideo: true,
                    });
                  }}
                />
              </>
            )}
          </Card>
          <Txt muted>
            {referral?.referralCount ?? 0} referred signups · Referral rewards are demo credits.
          </Txt>
          <Button
            title={t('signOut')}
            secondary
            onPress={async () => {
              await signOut();
              setModal(null);
            }}
          />
        </Sheet>
      )}
      {modal === 'browse' && (
        <Sheet title="Find your next stage" onClose={() => setModal(null)}>
          <Txt muted>Discover competitions, celebrate your talent.</Txt>
          {listLoading && <ActivityIndicator color={colors.teal} />}
          {!!listError && <Txt style={{ color: colors.red }}>{listError}</Txt>}
          {!listLoading && !listError && competitions.length === 0 && (
            <Txt>No competitions are available right now.</Txt>
          )}
          {competitions.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item._id}
              onPress={() => {
                setSlug(item.slug);
                setModal(null);
                scroller.current?.scrollTo({ y: 0 });
              }}
            >
              <Card style={{ gap: 8 }}>
                <View style={ui.row}>
                  <Icon name="musical-notes-outline" size={29} />
                  <Txt bold style={{ flex: 1, fontSize: 20 }}>
                    {item.title[locale]}
                  </Txt>
                  <Icon name="chevron-forward" />
                </View>
                <Txt muted>
                  {item.category[locale]} · {item.capacity - item.booked} spots left ·{' '}
                  {money(item.entryFee)}
                </Txt>
                <Txt style={{ color: colors.teal }}>{item.lifecycle.replaceAll('_', ' ')}</Txt>
              </Card>
            </Pressable>
          ))}
        </Sheet>
      )}
      {video && <VideoModal {...video} onClose={() => setVideo(null)} />}
    </SafeAreaView>
  );
}

function NavItem({
  compact,
  name,
  label,
  active,
  onPress,
}: {
  compact: boolean;
  name: React.ComponentProps<typeof Icon>['name'];
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        s.navItem,
        active && { flex: compact ? 1.45 : 1 },
        pressed && { opacity: 0.65 },
      ]}
    >
      <View style={[s.navIcon, active && s.navIconActive]}>
        <Icon name={name} size={compact ? 25 : 28} color={active ? colors.teal : '#9497B1'} />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        maxFontSizeMultiplier={1.2}
        style={{
          width: '100%',
          textAlign: 'center',
          lineHeight: 18,
          color: active ? colors.teal : colors.muted,
          fontSize: compact ? 11 : 12,
          fontFamily: active ? font.semibold : font.regular,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FEFEFF' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    padding: 24,
    backgroundColor: 'white',
  },
  page: { width: '100%', maxWidth: 820, gap: 10 },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languages: {
    flexDirection: 'row',
    backgroundColor: '#F2F3F7',
    borderWidth: 1,
    borderColor: '#E4E7EF',
    borderRadius: 30,
    padding: 1,
  },
  language: { borderRadius: 30, paddingHorizontal: 18, paddingVertical: 5 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: colors.pale,
    borderRadius: 11,
  },
  payoutPlay: {
    backgroundColor: '#B9E8D9',
    borderRadius: 12,
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referral: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    paddingHorizontal: 25,
    paddingVertical: 13,
    flexDirection: 'row',
    gap: 25,
    alignItems: 'center',
  },
  copyBox: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B4DEDF',
    borderRadius: 6,
    paddingLeft: 10,
    overflow: 'hidden',
  },
  copyButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderLeftWidth: 1,
    borderColor: '#B4DEDF',
  },
  chat: { backgroundColor: colors.subtle, padding: 7, borderRadius: 30 },
  ad: {
    flexDirection: 'row',
    gap: 15,
    backgroundColor: '#FBFBFE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D7DCEB',
    borderRadius: 9,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#F3F5F8',
  },
  footer: { width: '100%', maxWidth: 820, paddingTop: 7 },
  cta: {
    backgroundColor: colors.teal,
    borderRadius: 9,
    minHeight: 55,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0,100,114,.12)',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
    gap: 2,
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  navIcon: {
    width: 46,
    height: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: { backgroundColor: colors.pale },
  addCompact: { width: 48, height: 48, borderRadius: 14 },
  add: {
    width: 70,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    width: '90%',
    maxWidth: 520,
    backgroundColor: '#075D67',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0px 6px 24px rgba(0,40,50,.2)',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: colors.pale,
    borderRadius: 12,
  },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E8',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
