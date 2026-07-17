import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius } from '@/theme/tokens';
import { Button, Input, EyeToggle } from '@/components/ui/DesignSystem';
import Toast from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';

/* ─── Constants (unchanged) ─────────────────────────── */
const STEPS = ['Account Type', 'Personal Info', 'Finish'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

/* ─── Component ─────────────────────────────────────── */
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const t = useTheme();

  /* ── State (all original state preserved) ──────────── */
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [userType, setUserType] = useState<'client' | 'provider'>('client');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  /* New UX-only state */
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ── Toast helper (unchanged) ──────────────────────── */
  const showToast = (msg: string, type: 'success' | 'error' = 'error') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  /* ── Validation (unchanged logic, adapted to new steps) */
  const validateStep1 = () => {
    if (!fullName.trim()) return showToast('Please enter your full name');
    if (!email.trim()) return showToast('Please enter your email');
    if (!/\S+@\S+\.\S+/.test(email)) return showToast('Please enter a valid email');
    if (!phone.trim()) return showToast('Please enter your phone number');
    if (!state) return showToast('Please select your state');
    setStep(2);
  };

  const handleRegister = async () => {
    if (!agreedToTerms) return showToast('Please agree to the terms and conditions');
    if (password.length < 8) return showToast('Password must be at least 8 characters');
    if (password !== confirmPassword) return showToast('Passwords do not match');

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        user_type: userType,
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        state,
        lga: lga.trim() || undefined,
        referral_code: referralCode.trim() || undefined,
      });
      showToast('Registration successful!', 'success');
      setTimeout(() => router.replace('/(tabs)'), 1000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step Indicator ────────────────────────────────── */
  const renderStepIndicator = () => (
    <View style={s.stepRow}>
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <View style={s.stepItem}>
            <View
              style={[
                s.stepCircle,
                {
                  backgroundColor: i <= step ? t.rust : t.surface2,
                  borderColor: i <= step ? t.rust : t.borderS,
                },
              ]}
            >
              <Text style={[s.stepNum, { color: i <= step ? '#fff' : t.text3 }]}>
                {i + 1}
              </Text>
            </View>
            <Text
              style={[s.stepLabel, { color: i === step ? t.text : t.text3 }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={[
                s.stepLine,
                { backgroundColor: i < step ? t.rust : t.borderS },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  /* ── Step 0: Account Type ──────────────────────────── */
  const renderStep0 = () => (
    <>
      <Text style={[s.sectionTitle, { color: t.text }]}>I want to...</Text>
      <View style={s.typeContainer}>
        <TouchableOpacity
          style={[
            s.typeCard,
            {
              backgroundColor: userType === 'client' ? t.rustTint : t.surface,
              borderColor: userType === 'client' ? t.rust : t.borderS,
            },
          ]}
          onPress={() => setUserType('client')}
          activeOpacity={0.7}
        >
          <View
            style={[
              s.typeIconCircle,
              { backgroundColor: userType === 'client' ? t.rust : t.surface2 },
            ]}
          >
            <Ionicons
              name="briefcase-outline"
              size={28}
              color={userType === 'client' ? '#fff' : t.text3}
            />
          </View>
          <Text
            style={[
              s.typeTitle,
              { color: userType === 'client' ? t.rust : t.text },
            ]}
          >
            Hire Talent
          </Text>
          <Text style={[s.typeDesc, { color: t.text2 }]}>
            Post jobs and find skilled providers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.typeCard,
            {
              backgroundColor: userType === 'provider' ? t.violetTint : t.surface,
              borderColor: userType === 'provider' ? t.violet : t.borderS,
            },
          ]}
          onPress={() => setUserType('provider')}
          activeOpacity={0.7}
        >
          <View
            style={[
              s.typeIconCircle,
              { backgroundColor: userType === 'provider' ? t.violet : t.surface2 },
            ]}
          >
            <Ionicons
              name="build-outline"
              size={28}
              color={userType === 'provider' ? '#fff' : t.text3}
            />
          </View>
          <Text
            style={[
              s.typeTitle,
              { color: userType === 'provider' ? t.violet : t.text },
            ]}
          >
            Find Work
          </Text>
          <Text style={[s.typeDesc, { color: t.text2 }]}>
            Bid on jobs and earn money
          </Text>
        </TouchableOpacity>
      </View>

      <Button label="Next" onPress={() => setStep(1)} style={{ marginTop: space.md }} />
    </>
  );

  /* ── Step 1: Personal Info + Passwords ─────────────── */
  const renderStep1 = () => (
    <>
      <Input
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="John Doe"
        leftIcon="person-outline"
        autoCapitalize="words"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        placeholder="08012345678"
        leftIcon="call-outline"
        keyboardType="phone-pad"
        autoCapitalize="none"
      />
      <Input
        label="State"
        value={state}
        onChangeText={setState}
        placeholder="Select your state"
        leftIcon="location-outline"
        autoCapitalize="words"
      />
      <Input
        label="LGA (Optional)"
        value={lga}
        onChangeText={setLga}
        placeholder="Local Government Area"
        leftIcon="map-outline"
        autoCapitalize="words"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Min. 8 characters"
        secureTextEntry={!showPassword}
        leftIcon="lock-closed-outline"
        autoCapitalize="none"
        rightElement={
          <EyeToggle
            visible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        }
      />
      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter password"
        secureTextEntry={!showConfirmPassword}
        leftIcon="lock-closed-outline"
        autoCapitalize="none"
        rightElement={
          <EyeToggle
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        }
      />

      <View style={s.buttonRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button label="Back" variant="surface" onPress={() => setStep(0)} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Button label="Next" onPress={validateStep1} />
        </View>
      </View>
    </>
  );

  /* ── Step 2: Terms + Referral + Create ─────────────── */
  const renderStep2 = () => (
    <>
      <TouchableOpacity
        style={s.termsRow}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        activeOpacity={0.7}
      >
        <View
          style={[
            s.checkbox,
            {
              backgroundColor: agreedToTerms ? t.rust : 'transparent',
              borderColor: agreedToTerms ? t.rust : t.borderS,
            },
          ]}
        >
          {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={[s.termsText, { color: t.text2 }]}>
          I agree to the{' '}
          <Text style={{ color: t.rust, fontWeight: '600' }}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ color: t.rust, fontWeight: '600' }}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      <Input
        label="Referral Code (Optional)"
        value={referralCode}
        onChangeText={setReferralCode}
        placeholder="Enter code if you have one"
        leftIcon="gift-outline"
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <View style={s.buttonRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button label="Back" variant="surface" onPress={() => setStep(1)} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
          />
        </View>
      </View>
    </>
  );

  /* ── Render ────────────────────────────────────────── */
  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={t.text2} />
        </TouchableOpacity>

        {/* ProLink Wordmark */}
        <View style={s.wordmarkRow}>
          <Text style={[s.wordmark, { color: t.rust }]}>Pro</Text>
          <Text style={[s.wordmark, { color: t.text }]}>Link</Text>
        </View>
        <Text style={[s.subtitleText, { color: t.text2 }]}>
          Step {step + 1} of {STEPS.length}
        </Text>

        {renderStepIndicator()}

        <View style={s.form}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </View>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: t.text2 }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[s.linkText, { color: t.rust }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDone={() => setToastVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─────────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 16,
  },
  wordmarkRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitleText: {
    fontSize: 14,
    marginBottom: 24,
  },

  /* Step indicator */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
    marginBottom: 18,
    borderRadius: 1,
  },

  form: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  /* Type cards */
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  typeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Buttons */
  buttonRow: {
    flexDirection: 'row',
    marginTop: space.md,
  },

  /* Terms */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: space.xl,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
