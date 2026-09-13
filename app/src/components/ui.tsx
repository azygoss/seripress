import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const c = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: c, borderColor: c },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.chipText, active && { color: colors.onPrimary, fontFamily: fonts.bodySb }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger' | 'outline';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
      ? colors.accent
      : variant === 'danger'
      ? colors.dangerSoft
      : variant === 'outline'
      ? 'transparent'
      : colors.cardAlt;
  const fg =
    variant === 'primary' || variant === 'accent'
      ? colors.onPrimary
      : variant === 'danger'
      ? colors.danger
      : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function StatTile({
  value,
  label,
  color,
  icon,
}: {
  value: string | number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.statTile}>
      {icon}
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.text,
    letterSpacing: 0.4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.displayMd,
    fontSize: 21,
    color: colors.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  chipText: {
    fontFamily: fonts.bodyMd,
    fontSize: 13,
    color: colors.textMuted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    minHeight: 52,
  },
  buttonText: {
    fontFamily: fonts.displayMd,
    fontSize: 18,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.bodyMd,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.bodySb,
    fontSize: 16,
    color: colors.text,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xxxl,
  },
});
