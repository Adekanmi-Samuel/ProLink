import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '../ui/Avatar';
import { formatCurrency, timeAgo } from '../../utils/formatters';

interface BidCardProps {
  amount: number;
  proposal: string;
  providerName: string;
  providerAvatar?: string | null;
  durationDays?: number | null;
  submittedAt: string;
  onHire?: () => void;
  onViewProfile?: () => void;
}

export default function BidCard({
  amount,
  proposal,
  providerName,
  providerAvatar,
  durationDays,
  submittedAt,
  onHire,
  onViewProfile,
}: BidCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onViewProfile} style={styles.providerInfo}>
          <Avatar uri={providerAvatar} name={providerName} size={40} />
          <View style={styles.providerText}>
            <Text style={styles.providerName}>{providerName}</Text>
            <Text style={styles.time}>{timeAgo(submittedAt)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
          {durationDays != null && (
            <Text style={styles.duration}>{durationDays} days</Text>
          )}
        </View>
      </View>
      <Text style={styles.proposal} numberOfLines={3}>
        {proposal}
      </Text>
      {onHire && (
        <TouchableOpacity style={styles.hireButton} onPress={onHire}>
          <Text style={styles.hireText}>Hire Provider</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerText: {
    marginLeft: 10,
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  duration: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  proposal: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  hireButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  hireText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
