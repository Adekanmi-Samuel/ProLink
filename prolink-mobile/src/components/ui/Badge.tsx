import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple';
  size?: 'sm' | 'md';
}

const COLOR_MAP = {
  blue: { bg: '#dbeafe', text: '#1d4ed8' },
  green: { bg: '#dcfce7', text: '#15803d' },
  red: { bg: '#fecaca', text: '#dc2626' },
  yellow: { bg: '#fef9c3', text: '#a16207' },
  gray: { bg: '#f1f5f9', text: '#64748b' },
  purple: { bg: '#f3e8ff', text: '#7c3aed' },
};

export default function Badge({ label, color = 'blue', size = 'sm' }: BadgeProps) {
  const palette = COLOR_MAP[color];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg },
        isSmall ? styles.sm : styles.md,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: palette.text },
          isSmall ? styles.textSm : styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
});
