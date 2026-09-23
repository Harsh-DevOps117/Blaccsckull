import { type ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { colors, font } from '../../lib/theme';

import { styles } from './styles';
export function Txt({
  children,
  style,
  muted = false,
  bold = false,
  numberOfLines,
}: {
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
  bold?: boolean;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.text,
        muted && { color: colors.muted },
        bold && { fontFamily: font.semibold },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
