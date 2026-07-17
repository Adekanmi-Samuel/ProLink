import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
}

export default function Header({ title, onBack, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.side}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.side}>
            <Text style={styles.actionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  side: {
    width: 60,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '600',
  },
  actionText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
});
