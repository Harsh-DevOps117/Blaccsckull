import { Pressable, ScrollView, View } from 'react-native';
import { translate } from '../../lib/i18n';
import { colors, ordinal } from '../../lib/theme';
import { Card, Icon, PhotoCrop, Txt } from '../ui';

import { sectionStyles as s } from './sectionStyles';
import type { CompetitionSectionProps as Props } from './types';
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
