import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../lib/theme';

import { Icon } from './Icon';
import { styles } from './styles';
import { Txt } from './Txt';
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
