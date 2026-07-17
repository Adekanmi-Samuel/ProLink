import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatCurrency, timeAgo, formatJobType } from '../../utils/formatters';
import Badge from '../ui/Badge';

interface JobCardProps {
  id: number;
  title: string;
  description: string;
  budget?: number | null;
  jobType: string;
  categoryName?: string;
  bidCount?: number;
  postedAt: string;
  status: string;
  onPress: () => void;
}

export default function JobCard({
  title,
  description,
  budget,
  jobType,
  categoryName,
  bidCount = 0,
  postedAt,
  status,
  onPress,
}: JobCardProps) {
  const statusColor =
    status === 'open' ? 'green' : status === 'in_progress' ? 'blue' : 'gray';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Badge label={formatJobType(jobType)} color="blue" />
        <Badge label={status} color={statusColor as 'green' | 'blue' | 'gray'} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.budget}>
          {budget != null ? formatCurrency(budget) : 'Negotiable'}
        </Text>
        <Text style={styles.meta}>
          {bidCount} bid{bidCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.bottomRow}>
        {categoryName && <Text style={styles.category}>{categoryName}</Text>}
        <Text style={styles.time}>{timeAgo(postedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budget: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563eb',
  },
  meta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 13,
    color: '#64748b',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
