import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import { useJobsList } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import {
  ScreenHeader,
  TicketCard,
  Stamp,
  Divider,
  EmptyState,
} from '@/components/ui/DesignSystem';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';

/* ─── Types ─────────────────────────────────────────── */
interface Job {
  id: number;
  title: string;
  description: string;
  budget?: number | null;
  job_type: string;
  status: string;
  posted_at: string;
  category?: { id: number; name: string };
  bids?: Array<{ id: number }>;
  skills?: Array<{ skill_id: number; skill?: { name: string } }>;
}

/* ─── Filter data (unchanged) ───────────────────────── */
const CATEGORY_FILTERS = [
  { label: 'Digital', value: 'digital' },
  { label: 'Physical', value: 'physical' },
  { label: 'On-site', value: 'onsite' },
];

const BUDGET_FILTERS = [
  { label: 'Under 50k', value: '0-50000' },
  { label: '50k - 200k', value: '50000-200000' },
  { label: '200k+', value: '200000-999999999' },
];

/* ─── Component ─────────────────────────────────────── */
export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isClient } = useAuth();
  const t = useTheme();

  /* ── Filter state (unchanged) ──────────────────────── */
  const [search, setSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<string | null>(null);
  const [budgetFilter, setBudgetFilter] = useState<string | null>(null);

  const filters = {
    search: search || undefined,
    job_type: (jobTypeFilter as 'digital' | 'in_person') || undefined,
    min_budget: budgetFilter ? Number(budgetFilter.split('-')[0]) : undefined,
    max_budget: budgetFilter ? Number(budgetFilter.split('-')[1]) : undefined,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useJobsList(filters);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const jobs = data?.pages?.flatMap((p: { data: Job[] }) => p.data) ?? [];

  /* ── Filter helpers ────────────────────────────────── */
  const handleFilterSelect = (value: string, isBudget: boolean) => {
    if (isBudget) {
      setBudgetFilter(budgetFilter === value ? null : value);
    } else {
      setJobTypeFilter(jobTypeFilter === value ? null : value);
    }
  };

  /* ── Footer ────────────────────────────────────────── */
  const renderFooter = () => {
    if (!hasNextPage) return null;
    return (
      <TouchableOpacity
        style={s.loadMore}
        onPress={() => fetchNextPage()}
        disabled={isFetchingNextPage}
      >
        <Text style={[s.loadMoreText, { color: t.rust }]}>
          {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </Text>
      </TouchableOpacity>
    );
  };

  /* ── Job card renderer ─────────────────────────────── */
  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity
      onPress={() => router.push(`/jobs/${item.id}`)}
      activeOpacity={0.7}
      style={{ marginBottom: space.md }}
    >
      <TicketCard accent>
        {/* Top row: job number + category + status */}
        <View style={s.jobTop}>
          <View style={s.jobMeta}>
            <Text style={[s.jobNum, { color: t.text3 }]}>
              JOB #{String(item.id).padStart(4, '0')}
            </Text>
            {item.category && (
              <Stamp label={item.category.name} type="provider" />
            )}
          </View>
          <Stamp
            label={item.status}
            type={
              item.status === 'open'
                ? 'open'
                : item.status === 'in_progress'
                ? 'assigned'
                : 'done'
            }
          />
        </View>

        {/* Title */}
        <Text style={[s.jobTitle, { color: t.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Dashed divider */}
        <Divider
          style={{
            backgroundColor: t.borderS,
            height: 1,
            marginVertical: space.md,
            borderStyle: 'dashed',
          }}
        />

        {/* Bottom: budget + bid count */}
        <View style={s.jobBottom}>
          <Text style={[s.jobBudget, { color: t.rust }]}>
            {item.budget != null ? formatCurrency(item.budget) : 'No budget'}
          </Text>
          <View style={s.bidCount}>
            <Ionicons name="chatbubble-outline" size={14} color={t.text3} />
            <Text style={[s.bidCountText, { color: t.text3 }]}>
              {item.bids?.length || 0} bids
            </Text>
          </View>
        </View>
      </TicketCard>
    </TouchableOpacity>
  );

  /* ── Render ────────────────────────────────────────── */
  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <ScreenHeader
        title="Jobs"
        rightElement={
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="options-outline" size={22} color={t.text2} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={s.searchWrapper}>
        <View
          style={[
            s.searchBar,
            { backgroundColor: t.surface2, borderColor: t.borderS },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={t.text3} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            placeholder="Search jobs..."
            placeholderTextColor={t.text3}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={t.text3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipScroll}
      >
        {CATEGORY_FILTERS.map((f) => {
          const active = jobTypeFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => handleFilterSelect(f.value, false)}
              activeOpacity={0.7}
              style={[
                s.chip,
                {
                  backgroundColor: active ? t.rustTint : t.surface,
                  borderColor: active ? t.rust : t.borderS,
                },
              ]}
            >
              <Text style={[s.chipText, { color: active ? t.rust : t.text2 }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {BUDGET_FILTERS.map((f) => {
          const active = budgetFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => handleFilterSelect(f.value, true)}
              activeOpacity={0.7}
              style={[
                s.chip,
                {
                  backgroundColor: active ? t.violetTint : t.surface,
                  borderColor: active ? t.violet : t.borderS,
                },
              ]}
            >
              <Text
                style={[s.chipText, { color: active ? t.violet : t.text2 }]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Job List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item: Job) => String(item.id)}
          renderItem={renderJob}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No jobs found"
              body="Try adjusting your filters or search terms"
            />
          }
          ListFooterComponent={renderFooter}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* FAB */}
      {isClient && (
        <TouchableOpacity
          style={[
            s.fab,
            { backgroundColor: t.rust, bottom: insets.bottom + 16 },
          ]}
          onPress={() => router.push('/jobs/new')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Search */
  searchWrapper: {
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: 2,
  },

  /* Filter chips */
  chipScroll: {
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    gap: 8,
  },
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Job list */
  listContent: {
    paddingHorizontal: space.xl,
    paddingBottom: 100,
  },
  loadMore: {
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Job card internals */
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.sm,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobNum: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '500',
    letterSpacing: 0.7,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  jobBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobBudget: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  bidCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidCountText: {
    fontSize: 12,
    fontWeight: '400',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
});
