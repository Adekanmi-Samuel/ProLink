import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, StyleSheet, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { font, space, radius, shadow } from '../../theme/tokens';
import type { Theme } from '../../theme/tokens';

/* ─── Button ──────────────────────────────────────────── */
export function Button({
  label, onPress, variant = 'rust', size = 'md',
  loading = false, disabled = false, icon = null, style = {},
}: {
  label: string; onPress: () => void; variant?: string; size?: string;
  loading?: boolean; disabled?: boolean; icon?: React.ReactNode; style?: any;
}) {
  const t = useTheme();
  const variants: Record<string, any> = {
    rust: {
      bg: t.rust, border: t.rustDark, text: '#fff',
      shadowStyle: { shadowColor: t.rust, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.45, shadowRadius: 0, elevation: 4 },
    },
    violet: {
      bg: t.violet, border: t.violetDark, text: '#fff',
      shadowStyle: { shadowColor: t.violet, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.45, shadowRadius: 0, elevation: 4 },
    },
    surface: { bg: t.surface2, border: t.borderS, text: t.text, shadowStyle: {} },
    outline: { bg: 'transparent', border: t.borderS, text: t.text2, shadowStyle: {} },
    ghost: { bg: 'transparent', border: 'transparent', text: t.text2, shadowStyle: {} },
  };
  const v = variants[variant] || variants.rust;
  const sizes: Record<string, any> = {
    sm: { px: space.md, py: space.sm, textSize: 13 },
    md: { px: space.xl, py: 14, textSize: 15 },
    lg: { px: space.xxl, py: 17, textSize: 16 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: v.bg,
        borderWidth: 1.5, borderColor: v.border,
        borderRadius: radius.md,
        paddingHorizontal: s.px, paddingVertical: s.py,
        opacity: disabled ? 0.45 : 1,
        ...v.shadowStyle,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={{ ...font.headingS, fontSize: s.textSize, color: v.text }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ─── Input ────────────────────────────────────────────── */
export function Input({
  label, value, onChangeText, placeholder, secureTextEntry = false,
  keyboardType = 'default' as TextInputProps['keyboardType'], error = '',
  hint = '', style = {}, rightElement = null, multiline = false,
  numberOfLines = 1, leftIcon = null,
  autoCapitalize, autoCorrect, returnKeyType,
}: {
  label?: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; secureTextEntry?: boolean; keyboardType?: TextInputProps['keyboardType'];
  error?: string; hint?: string; style?: any; rightElement?: React.ReactNode;
  multiline?: boolean; numberOfLines?: number; leftIcon?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
}) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: space.md, ...style }}>
      {label && (
        <Text style={{ ...font.monoS, textTransform: 'uppercase' as const, letterSpacing: 0.9, color: t.text3, marginBottom: space.sm }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: t.surface2,
        borderWidth: 1.5,
        borderColor: error ? t.red : focused ? t.rust : t.borderS,
        borderRadius: radius.md,
        paddingHorizontal: space.lg,
        ...(focused ? { shadowColor: error ? t.red : t.rust, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 2 } : {}),
      }}>
        {leftIcon && (
          <Ionicons name={leftIcon as any} size={18} color={focused ? t.rust : t.text3} style={{ marginRight: 10, marginTop: multiline ? 14 : 0 }} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.text3}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={{
            flex: 1, ...font.bodyM, color: t.text,
            paddingVertical: 14,
          }}
        />
        {rightElement}
      </View>
      {error ? <Text style={{ ...font.bodyS, color: t.red, marginTop: 4 }}>{error}</Text> : null}
      {hint ? <Text style={{ ...font.bodyS, color: t.text3, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}

/* ─── Ticket Card ──────────────────────────────────────── */
export function TicketCard({ children, style = {}, accent = false }: {
  children: React.ReactNode; style?: any; accent?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[{
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      borderWidth: 1, borderColor: t.borderS,
      overflow: 'hidden',
      ...(accent ? { borderLeftWidth: 3, borderLeftColor: t.rust } : {}),
      ...shadow.sm,
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingTop: 6 }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View key={i} style={{
            flex: 1, height: 3,
            backgroundColor: i % 2 === 0 ? t.bg : 'transparent',
            borderRadius: 2,
          }} />
        ))}
      </View>
      <View style={{ padding: space.lg }}>{children}</View>
    </View>
  );
}

/* ─── Stamp / Badge ────────────────────────────────────── */
export function Stamp({ label, type = 'open' }: { label: string; type?: string }) {
  const t = useTheme();
  const types: Record<string, { color: string; bg: string }> = {
    open:     { color: t.green,  bg: t.greenTint },
    assigned: { color: t.amber,  bg: t.amberTint },
    done:     { color: t.text3,  bg: t.surface2 },
    completed:{ color: t.green,  bg: t.greenTint },
    client:   { color: t.rust,   bg: t.rustTint },
    provider: { color: t.violet, bg: t.violetTint },
    new:      { color: '#fff',   bg: t.rust },
    pending:  { color: t.amber,  bg: t.amberTint },
    funded:   { color: t.violet, bg: t.violetTint },
    paid:     { color: t.green,  bg: t.greenTint },
  };
  const s = types[type] || types.open;
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 5, borderWidth: 1.5, borderColor: s.color, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ ...font.monoS, color: s.color, textTransform: 'uppercase' as const, letterSpacing: 0.7 }}>{label}</Text>
    </View>
  );
}

/* ─── Eyebrow ──────────────────────────────────────────── */
export function Eyebrow({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <View style={{ width: 18, height: 1.5, backgroundColor: t.rust, borderRadius: 2 }} />
      <Text style={{ ...font.monoS, color: t.rust, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

/* ─── Avatar ────────────────────────────────────────────── */
export function Avatar({ uri, initials, size = 40 }: { uri?: string; initials?: string; size?: number }) {
  const t = useTheme();
  if (uri) {
    return (
      <Image source={{ uri }} style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 2, borderColor: t.borderS,
      }} />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: t.surface2, borderWidth: 2, borderColor: t.borderS,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ ...font.headingS, color: t.text2, fontSize: size * 0.38 }}>
        {(initials || '?').toUpperCase().slice(0, 2)}
      </Text>
    </View>
  );
}

/* ─── Stat Tile ────────────────────────────────────────── */
export function StatTile({ value, label, color }: { value: string; label: string; color?: string }) {
  const t = useTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: t.surface,
      borderRadius: radius.md, borderWidth: 1, borderColor: t.borderS,
      padding: space.lg, alignItems: 'flex-start', ...shadow.sm,
    }}>
      <Text style={{ ...font.displayM, color: color || t.text }}>{value}</Text>
      <Text style={{ ...font.bodyS, color: t.text2, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

/* ─── Empty State ──────────────────────────────────────── */
export function EmptyState({ icon, title, body, action }: {
  icon: string; title: string; body: string; action?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: space.xxxl, gap: space.md }}>
      <Text style={{ fontSize: 40, opacity: 0.5 }}>{icon}</Text>
      <Text style={{ ...font.headingM, color: t.text, textAlign: 'center' }}>{title}</Text>
      <Text style={{ ...font.bodyM, color: t.text2, textAlign: 'center', lineHeight: 22 }}>{body}</Text>
      {action}
    </View>
  );
}

/* ─── Divider ──────────────────────────────────────────── */
export function Divider({ style = {} }: { style?: any }) {
  const t = useTheme();
  return <View style={[{ height: 1, backgroundColor: t.border, marginVertical: space.md }, style]} />;
}

/* ─── Screen Header ────────────────────────────────────── */
export function ScreenHeader({ title, subtitle, rightElement, onBack }: {
  title: string; subtitle?: string; rightElement?: React.ReactNode; onBack?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{
      paddingTop: 56, paddingHorizontal: space.xl,
      paddingBottom: space.lg,
      backgroundColor: t.bg,
      borderBottomWidth: 1, borderBottomColor: t.border,
    }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ marginBottom: space.md, alignSelf: 'flex-start' }}>
          <Ionicons name="arrow-back" size={22} color={t.text2} />
        </TouchableOpacity>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...font.displayM, color: t.text }}>{title}</Text>
          {subtitle ? <Text style={{ ...font.bodyM, color: t.text2, marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
        {rightElement}
      </View>
    </View>
  );
}

/* ─── Password Toggle ──────────────────────────────────── */
export function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const t = useTheme();
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.text3} />
    </TouchableOpacity>
  );
}
