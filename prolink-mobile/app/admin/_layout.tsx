import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Access Denied</Text>
        <Text style={styles.subtext}>You do not have admin privileges.</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
  },
  text: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
});
