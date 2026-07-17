import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export default function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const fontSize = size * 0.38;
  const initials = getInitials(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#e2e8f0',
  },
  fallback: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
