import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';

/* ─── Custom Tab Bar ───────────────────────────────────── */
function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const t = useTheme();

  const tabConfig = [
    { name: 'index', icon: 'home' as const, iconOutline: 'home-outline' as const, label: 'Home' },
    { name: 'jobs', icon: 'briefcase' as const, iconOutline: 'briefcase-outline' as const, label: 'Jobs' },
    // Center slot is the FAB — no tab route
    { name: 'messages', icon: 'chatbubble' as const, iconOutline: 'chatbubble-outline' as const, label: 'Messages' },
    { name: 'profile', icon: 'person' as const, iconOutline: 'person-outline' as const, label: 'Profile' },
  ];

  // Insert a center FAB placeholder in the visual layout
  const leftTabs = tabConfig.slice(0, 2);
  const rightTabs = tabConfig.slice(2);

  const renderTab = (tab: typeof tabConfig[number]) => {
    const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
    const isFocused = state.index === routeIndex;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex].key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(tab.name);
      }
    };

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.tabItem}
      >
        <Ionicons
          name={isFocused ? tab.icon : tab.iconOutline}
          size={22}
          color={isFocused ? t.rust : t.text3}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? t.rust : t.text3 },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      <View style={styles.tabRow}>
        {/* Left two tabs */}
        {leftTabs.map(renderTab)}

        {/* Center FAB */}
        <TouchableOpacity
          activeOpacity={0.78}
          style={styles.fabTouchable}
          onPress={() => {
            // Placeholder — wire up to create-post flow
          }}
        >
          <View style={[styles.fab, { backgroundColor: t.rust, ...shadow.md }]}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Right two tabs */}
        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}

/* ─── Tab Layout ───────────────────────────────────────── */
export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // @ts-ignore – Expo Router wraps BottomTabs; tabBar is valid at runtime
        tabBar: (props) => <CustomTabBar {...props} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

/* ─── Styles ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingBottom: space.sm,
    paddingTop: space.xs,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: space.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xs,
  },
  tabLabel: {
    ...font.monoS,
    marginTop: 2,
  },
  fabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
    borderWidth: 3,
    borderColor: '#0C0C14',
  },
});
