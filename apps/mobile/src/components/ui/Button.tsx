import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../lib/theme';

import { styles } from './styles';
import { Txt } from './Txt';
export function Button({
  title,
  onPress,
  disabled,
  busy,
  secondary = false,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? colors.teal : 'white'} />
      ) : (
        <Txt
          bold
          style={{
            color: secondary ? colors.teal : 'white',
            textAlign: 'center',
          }}
        >
          {title}
        </Txt>
      )}
    </Pressable>
  );
}
