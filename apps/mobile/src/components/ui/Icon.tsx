import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { colors } from '../../lib/theme';

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
