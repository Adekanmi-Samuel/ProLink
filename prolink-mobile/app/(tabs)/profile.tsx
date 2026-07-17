import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import {
  Button,
  StatTile,
  Eyebrow,
  Avatar,
  Divider,
} from '@/components/ui/DesignSystem';
import { getInitials, formatCurrency } from '@/utils/formatters';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTheme();
  const { user, logout, isProvider } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  const initials = getInitials(user?.full_name);

  return (
    <LinearGradient
      colors={[t.bg, t.bg2]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.rust} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Section ────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={user?.avatar_url ?? undefined}
              initials={initials}
              size={84}
            />
            {/* Rust border ring */}
            <View style={[styles.avatarRing, { borderColor: t.rust }]} />
            {/* Pencil edit badge */}
            <TouchableOpacity
              style={[styles.editBadge, { backgroundColor: t.rust }]}
              onPress={() => router.push('/profile/edit' as never)}
              activeOpacity={0.75}
            >
              <Ionicons name="pencil" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Name & Info ──────────────────────── */}
        <View style={styles.infoSection}>
          <Text style={[font.displayM, { color: t.text, textAlign: 'center' }]}>
            {user?.full_name || 'Complete your profile'}
          </Text>
          <Text style={[font.bodyM, { color: t.text2, textAlign: 'center', marginTop: 4 }]}>
            {isProvider ? 'Service Provider' : 'Client'}
          </Text>
          <Text style={[font.mono, { color: t.rust, textAlign: 'center', marginTop: 6 }]}>
            {'₦'}0/week
          </Text>
        </View>

        {/* ── Stats Row ────────────────────────── */}
        <View style={styles.statsRow}>
          <StatTile value="0.0" label="Rating" color={t.amber} />
          <View style={{ width: space.sm }} />
          <StatTile value="0" label="Jobs Done" />
          <View style={{ width: space.sm }} />
          <StatTile value="0%" label="Completion" color={t.green} />
        </View>

        <Divider style={{ marginVertical: space.lg }} />

        {/* ── About ────────────────────────────── */}
        <Eyebrow label="About" />
        <Text style={[font.bodyM, { color: t.text2, lineHeight: 22, marginBottom: space.xl }]}>
          {user?.full_name
            ? `${user.full_name} is a verified ProLink ${isProvider ? 'service provider' : 'client'}.`
            : 'Tell others about yourself and what you do.'}
        </Text>

        {/* ── Skills ───────────────────────────── */}
        <Eyebrow label="Skills" />
        <View style={styles.chipRow}>
          {(isProvider ? ['Plumbing', 'Wiring', 'Painting'] : []).map((skill) => (
            <View
              key={skill}
              style={[styles.chip, { backgroundColor: t.violetTint, borderColor: t.violet }]}
            >
              <Text style={[font.bodyS, { color: t.violet }]}>{skill}</Text>
            </View>
          ))}
          {!isProvider && (
            <Text style={[font.bodyS, { color: t.text3 }]}>
              Skills appear here once added to your profile.
            </Text>
          )}
        </View>

        {/* ── Portfolio ────────────────────────── */}
        <Eyebrow label="Portfolio" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portfolioScroll}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.portfolioCard, { backgroundColor: t.surface, borderColor: t.border }]}
            >
              <Ionicons name="image-outline" size={32} color={t.text3} />
              <Text style={[font.bodyS, { color: t.text3, marginTop: space.sm }]}>
                Project {i}
              </Text>
            </View>
          ))}
        </ScrollView>

        <Divider style={{ marginVertical: space.xl }} />

        {/* ── Edit Profile Button ──────────────── */}
        <Button
          label="Edit Profile"
          onPress={() => router.push('/profile/edit' as never)}
          variant="rust"
          size="lg"
          icon={<Ionicons name="create-outline" size={18} color="#fff" />}
        />

        {/* ── Sign Out ─────────────────────────── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: t.red }]}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={[font.headingS, { color: t.red }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#E8490F',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0C0C14',
  },
  infoSection: {
    marginBottom: space.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.xl,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  portfolioScroll: {
    paddingRight: space.xl,
    gap: space.md,
    marginBottom: space.lg,
  },
  portfolioCard: {
    width: 120,
    height: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    marginTop: space.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
});
