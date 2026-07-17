import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import {
  ScreenHeader,
  Button,
  TicketCard,
  Stamp,
  Divider,
  EmptyState,
} from '@/components/ui/DesignSystem';
import { formatCurrency, formatDate, formatStatus } from '@/utils/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Earnings {
  total_earned: number;
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTheme();
  const { isProvider } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: earnings, isLoading: earningsLoading, refetch: refetchEarnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const res = await api.get('/profiles/me/earnings');
      return res.data.data as Earnings;
    },
    enabled: isProvider,
  });

  const { data: bankAccount, isLoading: bankLoading, refetch: refetchBank } = useQuery({
    queryKey: ['bank-account'],
    queryFn: async () => {
      const res = await api.get('/profiles/me/bank');
      return res.data.data;
    },
  });

  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.get('/payments/transactions');
      return res.data.data as Transaction[];
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEarnings(), refetchBank(), refetchTx()]);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeader title="Wallet" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.rust} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Balance Card ─────────────────────── */}
        {isProvider ? (
          <View style={[styles.balanceCard, { backgroundColor: t.surface, borderColor: t.borderS }, shadow.md]}>
            <Text style={[font.bodyM, { color: t.text2, marginBottom: space.xs }]}>
              Available Balance
            </Text>
            <Text style={[font.displayXL, { color: t.gold, marginBottom: space.lg }]}>
              {earningsLoading ? '...' : formatCurrency(earnings?.available_balance ?? 0)}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={[font.monoS, { color: t.text3 }]}>Pending</Text>
                <Text style={[font.headingS, { color: t.text2, marginTop: 2 }]}>
                  {formatCurrency(earnings?.pending_balance ?? 0)}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={[font.monoS, { color: t.text3 }]}>Total Earned</Text>
                <Text style={[font.headingS, { color: t.text2, marginTop: 2 }]}>
                  {formatCurrency(earnings?.total_earned ?? 0)}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={[font.monoS, { color: t.text3 }]}>Withdrawn</Text>
                <Text style={[font.headingS, { color: t.text2, marginTop: 2 }]}>
                  {formatCurrency(earnings?.total_withdrawn ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.balanceCard, { backgroundColor: t.surface, borderColor: t.borderS }, shadow.md]}>
            <Text style={[font.bodyM, { color: t.text2, marginBottom: space.xs }]}>
              Total Spent
            </Text>
            <Text style={[font.displayXL, { color: t.gold }]}>
              {formatCurrency(0)}
            </Text>
          </View>
        )}

        {/* ── Action Buttons ───────────────────── */}
        <View style={styles.actionsRow}>
          <Button
            label="Fund Wallet"
            onPress={() => {}}
            variant="rust"
            size="md"
            icon={<Ionicons name="wallet-outline" size={18} color="#fff" />}
            style={{ flex: 1 }}
          />
          <View style={{ width: space.md }} />
          {isProvider && (
            <Button
              label="Withdraw"
              onPress={() => {}}
              variant="outline"
              size="md"
              icon={<Ionicons name="arrow-up-outline" size={18} color={t.text2} />}
              style={{ flex: 1 }}
            />
          )}
        </View>

        <Divider style={{ marginBottom: space.xl }} />

        {/* ── Bank Account ─────────────────────── */}
        <Text style={[font.headingM, { color: t.text, marginBottom: space.md }]}>
          Bank Account
        </Text>
        {bankLoading ? (
          <LoadingSpinner color={t.rust} />
        ) : bankAccount ? (
          <TicketCard>
            <View style={styles.bankRow}>
              <View style={{ flex: 1 }}>
                <Text style={[font.headingS, { color: t.text }]}>
                  {bankAccount.bank_name}
                </Text>
                <Text style={[font.mono, { color: t.text2, marginTop: 2 }]}>
                  {bankAccount.account_number}
                </Text>
                <Text style={[font.bodyS, { color: t.text3, marginTop: 2 }]}>
                  {bankAccount.account_name}
                </Text>
              </View>
              <Stamp label="Linked" type="completed" />
            </View>
          </TicketCard>
        ) : (
          <TouchableOpacity
            style={[styles.addBankCard, { borderColor: t.borderS }]}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={24} color={t.rust} />
            <Text style={[font.headingS, { color: t.rust, marginLeft: space.sm }]}>
              Add Bank Account
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: space.xl }} />

        {/* ── Recent Transactions ──────────────── */}
        <Text style={[font.headingM, { color: t.text, marginBottom: space.md }]}>
          Recent Transactions
        </Text>
        {txLoading ? (
          <LoadingSpinner color={t.rust} />
        ) : transactions && transactions.length > 0 ? (
          transactions.map((tx) => {
            const isCredit = tx.type === 'credit' || tx.type === 'earning';
            return (
              <TicketCard key={tx.id} accent={isCredit} style={{ marginBottom: space.sm }}>
                <View style={styles.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[font.headingS, { color: t.text }]}>
                      {tx.description || formatStatus(tx.type)}
                    </Text>
                    <Text style={[font.monoS, { color: t.text3, marginTop: 2 }]}>
                      {formatDate(tx.created_at)}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        font.headingM,
                        { color: isCredit ? t.green : t.red },
                      ]}
                    >
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                    <Stamp
                      label={formatStatus(tx.status)}
                      type={tx.status === 'completed' ? 'completed' : 'pending'}
                    />
                  </View>
                </View>
              </TicketCard>
            );
          })
        ) : (
          <EmptyState
            icon="📋"
            title="No transactions yet"
            body="Your transaction history will appear here"
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
  },
  balanceCard: {
    padding: space.xl,
    marginBottom: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: space.xl,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    borderWidth: 2,
    borderColor: '#2C2C42',
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    marginBottom: space.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: space.md,
  },
});
