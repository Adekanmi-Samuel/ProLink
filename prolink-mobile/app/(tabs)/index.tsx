import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMyJobs, useMyBids } from '@/hooks/useJobs';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isClient, isProvider } = useAuth();
  const { data: myJobsData, isLoading: jobsLoading, refetch: refetchJobs } = useMyJobs();
  const { data: myBidsData, isLoading: bidsLoading, refetch: refetchBids } = useMyBids();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchBids()]);
    setRefreshing(false);
  }, [refetchJobs, refetchBids]);

  const greeting = isClient ? 'Find talent' : isProvider ? 'Find work' : 'Dashboard';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name || 'there'}!</Text>
          <Text style={styles.subtitle}>{greeting}</Text>
        </View>
        <Badge
          label={user?.user_type === 'provider' ? 'Provider' : 'Client'}
          color={user?.user_type === 'provider' ? 'blue' : 'green'}
        />
      </View>

      {isClient && (
        <>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{myJobsData?.pagination?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{myJobsData?.data?.filter((j: { status: string }) => j.status === 'open').length ?? 0}</Text>
              <Text style={styles.statLabel}>Open Jobs</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{myJobsData?.data?.filter((j: { status: string }) => j.status === 'in_progress').length ?? 0}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/jobs/new')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Post a Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionLabel}>Browse Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/wallet')}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isProvider && (
        <>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{myBidsData?.pagination?.total ?? 0}</Text>
              <Text style={styles.statLabel}>My Bids</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{myJobsData?.data?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Text style={styles.actionIcon}>💼</Text>
              <Text style={styles.actionLabel}>Find Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/wallet')}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionLabel}>My Profile</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent Bids</Text>
          {myBidsData?.data?.slice(0, 3).map((bid: { id: number; amount: number; proposal: string; job?: { title: string } }) => (
            <Card key={bid.id} style={styles.bidCard}>
              <Text style={styles.bidJobTitle} numberOfLines={1}>{bid.job?.title || 'Job'}</Text>
              <View style={styles.bidRow}>
                <Text style={styles.bidAmount}>{formatCurrency(bid.amount)}</Text>
                <Text style={styles.bidProposal} numberOfLines={1}>{bid.proposal}</Text>
              </View>
            </Card>
          ))}
          {myBidsData?.data?.length === 0 && (
            <Text style={styles.emptyText}>No bids yet. Start browsing jobs!</Text>
          )}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  bidCard: {
    marginBottom: 8,
  },
  bidJobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
  bidProposal: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
