import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '../ui/Avatar';
import { timeAgo, truncate } from '../../utils/formatters';

interface ChatThreadItemProps {
  id: number;
  otherUserName: string;
  otherUserAvatar?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  jobTitle?: string;
  onPress: () => void;
}

export function ChatThreadItem({
  otherUserName,
  otherUserAvatar,
  lastMessage,
  lastMessageAt,
  unreadCount,
  jobTitle,
  onPress,
}: ChatThreadItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Avatar uri={otherUserAvatar} name={otherUserName} size={50} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {otherUserName}
          </Text>
          <Text style={styles.time}>{timeAgo(lastMessageAt)}</Text>
        </View>
        {jobTitle && (
          <Text style={styles.jobTitle} numberOfLines={1}>
            {jobTitle}
          </Text>
        )}
        <View style={styles.bottomRow}>
          <Text style={[styles.message, unreadCount > 0 && styles.messageUnread]} numberOfLines={1}>
            {truncate(lastMessage, 60)}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface ChatThreadListProps {
  threads: Array<{
    id: number;
    otherUserName: string;
    otherUserAvatar?: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    jobTitle?: string;
  }>;
  onPress: (id: number) => void;
}

export default function ChatThreadList({ threads, onPress }: ChatThreadListProps) {
  return (
    <View>
      {threads.map((thread) => (
        <ChatThreadItem
          key={thread.id}
          {...thread}
          onPress={() => onPress(thread.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
  },
  jobTitle: {
    fontSize: 12,
    color: '#2563eb',
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
  messageUnread: {
    color: '#334155',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
