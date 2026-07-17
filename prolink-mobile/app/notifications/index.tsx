import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import { ScreenHeader, EmptyState, Divider } from '@/components/ui/DesignSystem';
import { timeAgo } from '@/utils/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/* ─── Types ────────────────────────────────────────────── */
interface Notification {
  id: number;
  type: 'new_bid' | 'hired' | 'message' | 'payment';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

/* ─── Type config ──────────────────────────────────────── */
const TYPE_CONFIG: Record<
  Notification['type'],
  { icon: string; iconLib: 'briefcase' | 'star' | 'chatbubble' | 'cash'; color: string; bg: string }
> = {
  new_bid:  { icon: 'briefcase',  iconLib: 'briefcase',  color: '#7C5CFC', bg: 'rgba(124,92,252,0.14)' },
  hired:    { icon: 'star',       iconLib: 'star',       color: '#D4A017', bg: 'rgba(212,160,23,0.14)' },
  message:  { icon: 'chatbubble', iconLib: 'chatbubble', color: '#E8490F', bg: 'rgba(232,73,15,0.14)' },
  payment:  { icon: 'cash',       iconLib: 'cash',       color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
};

/* ─── Component ────────────────────────────────────────── */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications');
        return res.data.data as Notification[];
      } catch {
        return [] as Notification[];
      }
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      try {
        await api.patch('/notifications/read-all');
      } catch {
        // Silently handle if endpoint doesn't exist yet
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const notifications = data ?? [];

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.message;

    return (
      <View
        style={[
          styles.notifRow,
          {
            borderBottomColor: t.border,
            borderLeftWidth: item.read ? 0 : 3,
            borderLeftColor: item.read ? 'transparent' : t.rust,
          },
        ]}
      >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
          <Ionicons name={config.iconLib} size={20} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifTopRow}>
            <Text
              style={[font.headingS, { color: t.text, flex: 1 }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View style={[styles.unreadDot, { backgroundColor: t.rust }]} />
            )}
          </View>
          <Text style={[font.bodyS, { color: t.text2, marginTop: 2 }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[font.monoS, { color: t.text3, marginTop: 4 }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) return <LoadingSpinner color={t.rust} />;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeader
        title="Notifications"
        rightElement={
          notifications.length > 0 ? (
            <TouchableOpacity
              onPress={() => markAllRead.mutate()}
              activeOpacity={0.7}
            >
              <Text style={[font.monoS, { color: t.rust, textTransform: 'uppercase' as const }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.rust} />}
        ListEmptyComponent={
          <EmptyState
            icon="🎉"
            title="You're all caught up"
            body="No new notifications right now"
          />
        }
      />
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: space.xxl,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: space.sm,
  },
});
