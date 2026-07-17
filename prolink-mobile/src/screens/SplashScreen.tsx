import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { font } from '../theme/tokens';

export default function SplashScreen({ navigation }: any) {
  const t = useTheme();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('(auth)');
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={[t.bg, t.bg2]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Kente geometric pattern — bottom half */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, row) => (
          <View key={row} style={{ flexDirection: 'row', position: 'absolute', bottom: row * 22, left: 0, right: 0 }}>
            {Array.from({ length: 20 }).map((_, col) => (
              <View key={col} style={{
                flex: 1, height: 14,
                backgroundColor: (row + col) % 3 === 0 ? t.rust : (row + col) % 3 === 1 ? t.violet : t.surface2,
                opacity: 0.045, margin: 1, borderRadius: 2,
              }} />
            ))}
          </View>
        ))}
      </View>

      <Animated.View style={{ alignItems: 'center', opacity: logoOpacity, transform: [{ translateY: logoY }] }}>
        {/* Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: t.rust, letterSpacing: -1 }}>Pro</Text>
          <Text style={{ fontSize: 40, fontWeight: '700', color: t.text, letterSpacing: -1 }}>Link</Text>
          <View style={{
            marginLeft: 8, borderWidth: 1, borderColor: t.rust,
            borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
            alignSelf: 'center',
          }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: '700', color: t.rust, letterSpacing: 1 }}>NG</Text>
          </View>
        </View>

        <Animated.Text style={{
          fontSize: 14, color: t.text2, marginTop: 12, letterSpacing: 0.3,
          opacity: tagOpacity,
        }}>
          Nigeria's Professional Freelance Network
        </Animated.Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
