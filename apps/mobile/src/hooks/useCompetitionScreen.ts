import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Share, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompetition } from '../hooks/useCompetition';
import { api } from '../lib/api';
import { translate, type Label } from '../lib/i18n';
import type { Competition, Locale } from '../lib/types';

type ModalName =
  | 'auth'
  | 'register'
  | 'paymentSuccess'
  | 'home'
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

export function useCompetitionScreen() {
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
  const [search, setSearch] = useState('');
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
    if (modal !== 'browse' && modal !== 'home') return;
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
      await api(`/competitions/${c.slug}/register`, {
        method: 'POST',
        body: JSON.stringify({ acceptDemoPayment: true }),
      });
      await refresh();
      setModal('paymentSuccess');
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
  return {
    slug,
    setSlug,
    state,
    data,
    user,
    loading,
    error,
    now,
    refreshing,
    refresh,
    authenticate,
    signOut,
    locale,
    setLocale,
    modal,
    setModal,
    video,
    setVideo,
    busy,
    setBusy,
    actionError,
    setActionError,
    toast,
    setToast,
    footerHeight,
    setFooterHeight,
    copied,
    setCopied,
    referral,
    setReferral,
    competitions,
    setCompetitions,
    search,
    setSearch,
    listError,
    setListError,
    listLoading,
    setListLoading,
    width,
    compact,
    insets,
    scroller,
    t,
    c,
    boundary,
    show,
    onVideo,
    act,
    register,
    share,
  };
}
export type CompetitionScreenState = ReturnType<typeof useCompetitionScreen>;
export type LoadedCompetitionState = CompetitionScreenState & {
  data: NonNullable<CompetitionScreenState['data']>;
  c: NonNullable<CompetitionScreenState['c']>;
};
