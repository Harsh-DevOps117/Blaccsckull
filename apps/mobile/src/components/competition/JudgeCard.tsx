import { Pressable, View } from 'react-native';
import { translate } from '../../lib/i18n';
import { Card, Icon, PhotoCrop, Txt } from '../ui';

import { sectionStyles as s } from './sectionStyles';
import type { CompetitionSectionProps as Props } from './types';
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
