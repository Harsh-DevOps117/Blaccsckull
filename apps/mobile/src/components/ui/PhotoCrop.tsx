import { Image, View } from 'react-native';
import { colors } from '../../lib/theme';
import type { Photo } from '../../lib/types';

export function PhotoCrop({
  uri,
  crop,
  size,
  height = size,
  round = false,
}: {
  uri: string;
  crop: Photo;
  size: number;
  height?: number;
  round?: boolean;
}) {
  const scale = Math.max(size / crop.width, height / crop.height);
  return (
    <View
      style={{
        width: size,
        height,
        overflow: 'hidden',
        borderRadius: round ? size / 2 : 12,
        backgroundColor: colors.pale,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri }}
        style={{
          position: 'absolute',
          width: 853 * scale,
          height: 1844 * scale,
          left: -crop.x * scale,
          top: -crop.y * scale,
        }}
      />
    </View>
  );
}
