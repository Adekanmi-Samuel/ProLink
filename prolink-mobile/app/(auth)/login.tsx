import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import { Button, Input, TicketCard, Eyebrow, EyeToggle } from '@/components/ui/DesignSystem';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const t = useTheme();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient glow */}
        <View style={{
          position: 'absolute', top: -80, left: '50%', marginLeft: -150,
          width: 300, height: 300, borderRadius: 150,
          backgroundColor: t.rustGlow,
        }} pointerEvents="none" />

        {/* Logo area */}
        <View style={{ alignItems: 'center', paddingTop: 80, paddingBottom: 32 }}>
          <Eyebrow label="Welcome back" />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1, marginTop: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: t.rust, letterSpacing: -0.6 }}>Pro</Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: t.text, letterSpacing: -0.6 }}>Link</Text>
          </View>
        </View>

        {/* Form in a TicketCard */}
        <View style={{ paddingHorizontal: 20 }}>
          <TicketCard>
            {/* Error banner */}
            {error ? (
              <View style={{
                backgroundColor: t.redTint, borderRadius: radius.sm,
                borderWidth: 1, borderColor: t.red,
                paddingHorizontal: 12, paddingVertical: 10, marginBottom: space.md,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <Ionicons name="alert-circle" size={16} color={t.red} />
                <Text style={{ ...font.bodyS, color: t.red, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon="mail-outline"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              leftIcon="lock-closed-outline"
              rightElement={<EyeToggle visible={showPw} onToggle={() => setShowPw(!showPw)} />}
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginBottom: space.lg }}
            >
              <Text style={{ ...font.bodyS, color: t.rust, fontWeight: '500' }}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Remember me */}
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space.lg }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 5,
                borderWidth: 1.5, borderColor: rememberMe ? t.rust : t.borderS,
                backgroundColor: rememberMe ? t.rust : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={{ ...font.bodyS, color: t.text2 }}>Remember me</Text>
            </TouchableOpacity>

            <Button
              label="Log in"
              variant="rust"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleLogin}
              icon={!loading ? <Ionicons name="log-in-outline" size={18} color="#fff" /> : undefined}
            />
          </TicketCard>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, paddingBottom: 40 }}>
          <Text style={{ ...font.bodyM, color: t.text2 }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={{ ...font.bodyM, color: t.rust, fontWeight: '700' }}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
