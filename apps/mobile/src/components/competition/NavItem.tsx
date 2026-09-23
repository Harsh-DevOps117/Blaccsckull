import { Pressable, Text, View } from 'react-native';
import { colors, font } from '../../lib/theme';
import { Icon } from '../ui';

import { screenStyles as s } from './screenStyles';
export function NavItem({
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
