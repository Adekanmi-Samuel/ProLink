import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data as Record<string, unknown>;
    },
  });

  const { data: verifications, isLoading: verLoading, refetch: refetchVer } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: async () => {
      const res = await api.get('/admin/verifications', { params: { limit: 5 } });
      return res.data;
    },
  });

  const { data: disputes, isLoading: disputeLoading, refetch: refetchDisputes } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const res = await api.get('/admin/disputes', { params: { limit: 5 } });
      return res.data;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchVer(), refetchDisputes()]);
    setRefreshing(false);
  };

  if (statsLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{(stats?.total_users as number) ?? 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>💼</Text>
            <Text style={styles.statValue}>{(stats?.total_jobs as number) ?? 0}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>
              {formatCurrency((stats?.total_revenue as number) ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{(stats?.active_jobs as number) ?? 0}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Pending Verifications</Text>
        {verLoading ? (
          <LoadingSpinner />
        ) : verifications?.data?.length > 0 ? (
          verifications.data.map((v: { id: number; full_name?: string; cac_status?: string; nin_status?: string; user?: { email?: string } }) => (
            <Card key={v.id} style={styles.listItem}>
              <View style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{v.full_name || v.user?.email || 'User'}</Text>
                  <Text style={styles.listSubtitle}>
                    CAC: {v.cac_status || 'none'} | NIN: {v.nin_status || 'none'}
                  </Text>
                </View>
                <Badge label="Pending" color="yellow" />
              </View>
            </Card>
          ))
        ) : (
          <EmptyState title="No pending verifications" />
        )}

        <Text style={styles.sectionTitle}>Recent Disputes</Text>
        {disputeLoading ? (
          <LoadingSpinner />
        ) : disputes?.data?.length > 0 ? (
          disputes.data.map((d: { id: number; reason: string; status: string; created_at: string }) => (
            <Card key={d.id} style={styles.listItem}>
              <View style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle} numberOfLines={1}>{d.reason}</Text>
                  <Text style={styles.listSubtitle}>{formatDate(d.created_at)}</Text>
                </View>
                <Badge
                  label={d.status}
                  color={d.status === 'open' ? 'red' : d.status === 'resolved' ? 'green' : 'yellow'}
                />
              </View>
            </Card>
          ))
        ) : (
          <EmptyState title="No recent disputes" />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  listItem: {
    marginBottom: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
});
