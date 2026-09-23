import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, font } from '../lib/theme';
import type { Photo } from '../lib/types';

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
export function Icon({
  name,
  size = 22,
  color = colors.teal,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
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
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Txt bold style={{ fontSize: 21, flex: 1 }}>
              {title}
            </Txt>
            <Pressable
              accessibilityLabel="Close dialog"
              accessibilityRole="button"
              onPress={onClose}
              hitSlop={12}
            >
              <Icon name="close" color={colors.ink} size={25} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, gap: 16 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export const styles = StyleSheet.create({
  text: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 20,
    boxShadow: '0px 1px 5px rgba(20, 38, 73, 0.035)',
  },
  button: {
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#B2DDE1',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9,23,48,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: 'white',
    borderRadius: 22,
    overflow: 'hidden',
    boxShadow: '0px 16px 60px rgba(10,30,40,.15)',
  },
  sheetHeader: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDE3EE',
    backgroundColor: '#FCFDFE',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontFamily: font.regular,
    color: colors.ink,
    minHeight: 49,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { backgroundColor: '#FFF1F2', borderRadius: 9, padding: 12 },
});
