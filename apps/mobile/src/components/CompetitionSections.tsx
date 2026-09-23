import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { translate } from '../lib/i18n';
import { colors, money, ordinal } from '../lib/theme';
import type { Competition, Details, Locale } from '../lib/types';
import { Card, Icon, PhotoCrop, Txt, styles as ui } from './ui';

type Props = { data: Details; locale: Locale; compact: boolean };
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

export function JudgeCard({
  data,
  locale,
  compact,
  onVideo,
}: Props & { onVideo: (title: string, url: string) => void }) {
  const j = data.competition.judge;
  return (
    <Card
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: compact ? 12 : 28,
        paddingVertical: 12,
        paddingHorizontal: compact ? 16 : 34,
      }}
    >
      <PhotoCrop uri={data.media.referenceUrl} crop={j.photo} size={compact ? 70 : 101} round />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt muted style={{ fontSize: 14 }}>
          {translate('judge', locale)}
        </Txt>
        <Txt bold style={{ fontSize: compact ? 18 : 21 }}>
          {j.name}
        </Txt>
        <Txt muted style={{ fontSize: compact ? 12 : 15 }}>
          {j.role[locale]}
        </Txt>
        <Txt muted style={{ fontSize: compact ? 12 : 15 }}>
          {j.experience[locale]}
        </Txt>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('intro', locale)}
        onPress={() => onVideo(j.name, j.videoUrl)}
        style={{ alignItems: 'center', gap: 4, paddingHorizontal: compact ? 0 : 35 }}
      >
        <View style={s.play}>
          <Icon name="play" size={25} />
        </View>
        <Txt muted style={{ fontSize: compact ? 11 : 15 }}>
          {translate('intro', locale)}
        </Txt>
      </Pressable>
    </Card>
  );
}

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

export function WinnersCard({
  data,
  locale,
  compact,
  onVideo,
}: Props & { onVideo: (title: string, url: string) => void }) {
  return (
    <Card
      style={{
        padding: 14,
        paddingHorizontal: compact ? 14 : 18,
        paddingRight: 0,
        overflow: 'hidden',
      }}
    >
      <Txt bold style={{ marginBottom: 10 }}>
        {translate('previous', locale)}
      </Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingRight: 16 }}
      >
        {data.competition.winners.map((w, i) => (
          <Pressable
            key={`${w.name}-${i}`}
            accessibilityRole="button"
            accessibilityLabel={`Watch ${w.name}`}
            onPress={() => onVideo(w.name, w.videoUrl)}
            style={s.winner}
          >
            <View>
              <PhotoCrop
                uri={data.media.referenceUrl}
                crop={w.photo}
                size={compact ? 72 : 88}
                height={compact ? 76 : 90}
              />
              <View style={s.miniPlay}>
                <Icon name="play" size={16} color="white" />
              </View>
            </View>
            <View style={{ paddingRight: 15, gap: 3 }}>
              <Txt style={{ fontSize: 14 }}>{w.name}</Txt>
              <Txt style={{ fontSize: 13, color: w.position < 3 ? colors.teal : colors.muted }}>
                {ordinal(w.position)} {translate('winner', locale)}
              </Txt>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Card>
  );
}

export function InformationCard({
  c,
  locale,
  compact,
}: {
  c: Competition;
  locale: Locale;
  compact: boolean;
}) {
  const [tab, setTab] = useState<'about' | 'criteria' | 'rules'>('about');
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={{ padding: compact ? 14 : 22, paddingTop: 8, paddingBottom: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#E0E5EF',
          marginBottom: 14,
        }}
      >
        {(['about', 'criteria', 'rules'] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            onPress={() => setTab(item)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 3,
              borderColor: tab === item ? colors.teal : 'transparent',
              paddingVertical: 13,
            }}
          >
            <Txt
              bold
              style={{
                color: tab === item ? colors.teal : colors.muted,
                fontSize: compact ? 11 : 16,
                textAlign: 'center',
              }}
            >
              {translate(item, locale)}
            </Txt>
          </Pressable>
        ))}
      </View>
      {tab === 'about' && (
        <>
          <Txt muted style={{ fontSize: compact ? 14 : 17, lineHeight: 25 }}>
            {c.about[locale]}
          </Txt>
          {expanded && (
            <Txt muted style={{ marginTop: 10, lineHeight: 25 }}>
              {c.aboutMore[locale]}
            </Txt>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded(!expanded)}
            style={[ui.row, { justifyContent: 'center', paddingTop: 6 }]}
          >
            <Txt style={{ color: colors.teal }}>
              {translate(expanded ? 'less' : 'more', locale)}
            </Txt>
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
          </Pressable>
        </>
      )}
      {tab === 'criteria' && (
        <View style={{ gap: 12, paddingBottom: 8 }}>
          {c.criteria.map((v) => (
            <View key={v.label.en} style={{ gap: 5 }}>
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <Txt>{v.label[locale]}</Txt>
                <Txt bold style={{ color: colors.teal }}>
                  {v.weight}%
                </Txt>
              </View>
              <View style={s.progress}>
                <View style={{ width: `${v.weight}%`, height: 5, backgroundColor: colors.teal }} />
              </View>
            </View>
          ))}
        </View>
      )}
      {tab === 'rules' && (
        <View style={{ gap: 12, paddingBottom: 10 }}>
          {c.rules.map((rule, i) => (
            <View key={i} style={[ui.row, { alignItems: 'flex-start' }]}>
              <Icon name="checkmark-circle-outline" size={19} />
              <Txt muted style={{ flex: 1 }}>
                {rule[locale]}
              </Txt>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

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

const s = StyleSheet.create({
  registered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF6F7',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderColor: '#B8DFE3',
  },
  chip: { paddingHorizontal: 13, paddingVertical: 5, backgroundColor: '#F4F5F9', borderRadius: 8 },
  progress: { height: 5, borderRadius: 4, backgroundColor: '#D6EBED', overflow: 'hidden' },
  play: {
    height: 57,
    width: 57,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7FB',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pale,
    borderRadius: 13,
    paddingHorizontal: 32,
    paddingVertical: 13,
    gap: 20,
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    padding: 5,
  },
  dateCell: {
    width: '50%',
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  winner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F6F7FA',
    borderRadius: 13,
    overflow: 'hidden',
  },
  miniPlay: {
    position: 'absolute',
    bottom: 5,
    right: 4,
    width: 31,
    height: 31,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reward: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFC',
  },
});
