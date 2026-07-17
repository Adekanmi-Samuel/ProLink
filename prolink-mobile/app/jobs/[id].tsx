import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius } from '@/theme/tokens';
import { useJobDetail, useSubmitBid } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import {
  ScreenHeader,
  TicketCard,
  Stamp,
  Button,
  Input,
  Avatar,
  Eyebrow,
  Divider,
} from '@/components/ui/DesignSystem';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BidCard from '@/components/jobs/BidCard';
import Toast from '@/components/ui/Toast';
import { formatCurrency, timeAgo, formatJobType, formatStatus } from '@/utils/formatters';

/* ─── Component ─────────────────────────────────────── */
export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isClient, isProvider } = useAuth();
  const { data: job, isLoading, refetch } = useJobDetail(Number(id));
  const submitBid = useSubmitBid();
  const t = useTheme();

  /* ── State (all original state preserved) ──────────── */
  const [bidAmount, setBidAmount] = useState('');
  const [bidDuration, setBidDuration] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [refreshing, setRefreshing] = useState(false);

  /* ── Handlers (unchanged) ──────────────────────────── */
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || !bidProposal.trim()) {
      setToastMessage('Please fill in amount and proposal');
      setToastType('error');
      setToastVisible(true);
      return;
    }
    try {
      await submitBid.mutateAsync({
        jobId: Number(id),
        data: {
          amount: Number(bidAmount),
          duration_days: bidDuration ? Number(bidDuration) : undefined,
          proposal: bidProposal.trim(),
        },
      });
      setToastMessage('Bid submitted successfully!');
      setToastType('success');
      setToastVisible(true);
      setShowBidForm(false);
      setBidAmount('');
      setBidDuration('');
      setBidProposal('');
    } catch {
      setToastMessage('Failed to submit bid');
      setToastType('error');
      setToastVisible(true);
    }
  };

  /* ── Loading ───────────────────────────────────────── */
  if (isLoading || !job) return <LoadingSpinner />;

  const hasBid = job.bids?.some((b) => b.provider_id === user?.id);

  /* ── Render ────────────────────────────────────────── */
  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <ScreenHeader title="Job Details" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ticket Card ───────────────────────────── */}
        <TicketCard accent style={{ marginBottom: space.lg }}>
          {/* Top row: job number + stamps */}
          <View style={s.ticketTop}>
            <View style={s.ticketMeta}>
              <Text style={[s.ticketNum, { color: t.text3 }]}>
                JOB #{String(job.id).padStart(4, '0')}
              </Text>
              <Stamp label={formatJobType(job.job_type)} type="provider" />
            </View>
            <Stamp
              label={formatStatus(job.status)}
              type={
                job.status === 'open'
                  ? 'open'
                  : job.status === 'in_progress'
                  ? 'assigned'
                  : 'done'
              }
            />
          </View>

          {/* Title */}
          <Text style={[s.ticketTitle, { color: t.text }]}>{job.title}</Text>

          {/* Client info */}
          {job.client && (
            <View style={s.clientInfo}>
              <Avatar
                uri={job.client.profile?.profile_picture_url}
                initials={job.client.profile?.full_name || job.client.email}
                size={28}
              />
              <Text style={[s.clientName, { color: t.text2 }]}>
                {job.client.profile?.full_name || job.client.email}
              </Text>
              <Text style={[s.postedTime, { color: t.text3 }]}>
                {timeAgo(job.posted_at)}
              </Text>
            </View>
          )}

          {/* Dashed divider */}
          <Divider
            style={{
              backgroundColor: t.borderS,
              height: 1,
              marginVertical: space.md,
              borderStyle: 'dashed',
            }}
          />

          {/* Budget */}
          {job.budget != null && (
            <View style={s.budgetRow}>
              <Text style={[s.budgetLabel, { color: t.text3 }]}>Budget</Text>
              <Text style={[s.budgetValue, { color: t.rust }]}>
                {formatCurrency(job.budget)}
              </Text>
            </View>
          )}
        </TicketCard>

        {/* ── Description ──────────────────────────── */}
        <View
          style={[
            s.card,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
        >
          <Eyebrow label="Description" />
          <Text style={[s.description, { color: t.text2 }]}>{job.description}</Text>
        </View>

        {/* ── Skills ───────────────────────────────── */}
        {job.skills && job.skills.length > 0 && (
          <View style={s.section}>
            <Eyebrow label="Skills Required" />
            <View style={s.skillsRow}>
              {job.skills.map((js) => (
                <View
                  key={js.skill_id}
                  style={[
                    s.skillChip,
                    { backgroundColor: t.violetTint, borderColor: t.violet },
                  ]}
                >
                  <Text style={[s.skillText, { color: t.violet }]}>
                    {js.skill?.name || `Skill ${js.skill_id}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Bids (client view) ──────────────────── */}
        {isClient && job.bids && job.bids.length > 0 && (
          <View style={s.section}>
            <Eyebrow label={`Bids (${job.bids.length})`} />
            {job.bids.map((bid) => (
              <BidCard
                key={bid.id}
                amount={bid.amount}
                proposal={bid.proposal}
                providerName={
                  bid.provider?.profile?.full_name ||
                  bid.provider?.email ||
                  'Provider'
                }
                providerAvatar={bid.provider?.profile?.profile_picture_url}
                durationDays={bid.duration_days}
                submittedAt={bid.submitted_at}
                onHire={() => {
                  Alert.alert(
                    'Hire Provider',
                    'Are you sure you want to hire this provider?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Hire', onPress: () => {} },
                    ],
                  );
                }}
                onViewProfile={() => {
                  if (bid.provider_id) {
                    router.push(`/profiles/${bid.provider_id}` as never);
                  }
                }}
              />
            ))}
          </View>
        )}

        {/* ── Bid Form (provider view) ────────────── */}
        {isProvider && job.status === 'open' && !hasBid && (
          <View style={s.section}>
            {!showBidForm ? (
              <Button
                label="Submit a Bid"
                onPress={() => setShowBidForm(true)}
                icon={
                  <Ionicons name="document-text-outline" size={18} color="#fff" />
                }
              />
            ) : (
              <View
                style={[
                  s.bidFormCard,
                  { backgroundColor: t.surface, borderColor: t.border },
                ]}
              >
                <Eyebrow label="Your Bid" />
                <Input
                  label="Amount"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder="Amount (₦)"
                  leftIcon="cash-outline"
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
                <Input
                  label="Duration (Optional)"
                  value={bidDuration}
                  onChangeText={setBidDuration}
                  placeholder="Duration in days"
                  leftIcon="time-outline"
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
                <Input
                  label="Proposal"
                  value={bidProposal}
                  onChangeText={setBidProposal}
                  placeholder="Write your proposal..."
                  leftIcon="document-text-outline"
                  multiline
                  numberOfLines={4}
                  autoCapitalize="sentences"
                />
                <View style={s.bidActions}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Button
                      label="Cancel"
                      variant="surface"
                      onPress={() => setShowBidForm(false)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Button
                      label="Submit Bid"
                      onPress={handleSubmitBid}
                      loading={submitBid.isPending}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Already bid info ─────────────────────── */}
        {isProvider && hasBid && (
          <View
            style={[
              s.infoBox,
              { backgroundColor: t.violetTint, borderColor: t.violet },
            ]}
          >
            <Ionicons name="information-circle" size={18} color={t.violet} />
            <Text style={[s.infoText, { color: t.violet }]}>
              You have already submitted a bid for this job.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDone={() => setToastVisible(false)}
      />
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
  },

  /* Ticket card internals */
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.sm,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNum: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '500',
    letterSpacing: 0.7,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: space.sm,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  postedTime: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
  },
  budgetValue: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '700',
  },

  /* Description card */
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.lg,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },

  /* Skills */
  section: {
    marginBottom: space.xl,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: space.sm,
  },
  skillChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Bid form */
  bidFormCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
  },
  bidActions: {
    flexDirection: 'row',
    marginTop: space.sm,
  },

  /* Already bid info */
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});
