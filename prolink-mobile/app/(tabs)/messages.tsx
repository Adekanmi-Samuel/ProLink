import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import { ScreenHeader, EmptyState, Avatar } from '@/components/ui/DesignSystem';
import { timeAgo, truncate, getInitials } from '@/utils/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ChatThread {
  id: number;
  client_id: number;
  provider_id: number;
  client?: { id: number; email: string; full_name?: string; profile?: { full_name?: string; profile_picture_url?: string } };
  provider?: { id: number; email: string; full_name?: string; profile?: { full_name?: string; profile_picture_url?: string } };
  job?: { id: number; title?: string };
  messages?: Array<{ content: string; sent_at: string }>;
  created_at: string;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: async () => {
      const res = await api.get('/chats');
      return res.data.data as ChatThread[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const threads = data ?? [];

  const getOtherUser = (thread: ChatThread) => {
    if (user?.id === thread.client_id) return thread.provider;
    return thread.client;
  };

  if (isLoading) return <LoadingSpinner color={t.rust} />;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeader title="Messages" />

      <FlatList
        data={threads}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const other = getOtherUser(item);
          const name = other?.full_name || other?.email || 'User';
          const avatarUri = other?.profile?.profile_picture_url;
          const lastMsg = item.messages?.[0];

          return (
            <TouchableOpacity
              style={[styles.threadRow, { borderBottomColor: t.border }]}
              onPress={() => router.push(`/messages/${item.id}`)}
              activeOpacity={0.7}
            >
              <Avatar uri={avatarUri ?? undefined} initials={getInitials(name)} size={50} />

              <View style={styles.threadContent}>
                <View style={styles.threadTopRow}>
                  <Text style={[font.headingS, { color: t.text, flex: 1 }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[font.monoS, { color: t.text3, marginLeft: space.sm }]}>
                    {timeAgo(lastMsg?.sent_at || item.created_at)}
                  </Text>
                </View>

                {item.job?.title && (
                  <Text style={[font.bodyS, { color: t.rust, marginBottom: 2 }]} numberOfLines={1}>
                    {item.job.title}
                  </Text>
                )}

                <View style={styles.threadBottomRow}>
                  <Text style={[font.bodyS, { color: t.text3, flex: 1 }]} numberOfLines={1}>
                    {truncate(lastMsg?.content || 'No messages yet', 55)}
                  </Text>
                  {/* Placeholder for unread badge - unreadCount always 0 in current data */}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.rust} />}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No conversations yet"
            body="Start a chat from a job you've been hired for"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderBottomWidth: 1,
  },
  threadContent: {
    flex: 1,
    marginLeft: space.md,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  threadBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: space.xxl,
  },
});
