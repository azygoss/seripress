import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Clock, Home, Layers, Repeat } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';
import { colors, fonts, radius, spacing } from '../theme';
import { ExerciseThumb } from '../components/ExerciseImage';
import { Button, Card, EmptyState } from '../components/ui';
import { fmtDuration } from '../lib/format';
import * as Haptics from 'expo-haptics';

export default function SummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sessions = useAppStore((s) => s.sessions);

  const session = useMemo(() => sessions.find((s) => s.id === sessionId), [sessions, sessionId]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!session) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title="Oturum bulunamadı" />
        <Button title="Ana Sayfa" onPress={() => router.replace('/(tabs)')} style={{ marginHorizontal: spacing.xl }} />
      </View>
    );
  }

  const totalReps = session.exercises.reduce((n, e) => n + e.repsCompleted, 0);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + 120, paddingHorizontal: spacing.lg }}>
        <View style={styles.checkWrap}>
          <CheckCircle2 color={colors.accent} size={72} />
        </View>
        <Text style={styles.title}>Antrenman Tamamlandı!</Text>
        <Text style={styles.subtitle}>{session.routineName}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Clock color={colors.info} size={18} />
            <Text style={styles.statValue}>{fmtDuration(session.durationSec)}</Text>
            <Text style={styles.statLabel}>Süre</Text>
          </View>
          <View style={styles.statBox}>
            <Layers color={colors.primary} size={18} />
            <Text style={styles.statValue}>{session.totalSets}</Text>
            <Text style={styles.statLabel}>Set</Text>
          </View>
          <View style={styles.statBox}>
            <Repeat color={colors.accent} size={18} />
            <Text style={styles.statValue}>{totalReps}</Text>
            <Text style={styles.statLabel}>Tekrar/Sn</Text>
          </View>
        </View>

        <Text style={styles.listTitle}>YAPILAN EGZERSİZLER</Text>
        <Card style={{ padding: 0 }}>
          {session.exercises.map((e, i) => (
            <View key={e.exerciseId} style={[styles.exRow, i > 0 && styles.exBorder]}>
              <ExerciseThumb id={e.exerciseId} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={styles.exName} numberOfLines={1}>{e.name}</Text>
                <Text style={styles.exMeta}>
                  {e.setsCompleted} set × {e.timed ? `${Math.round(e.repsCompleted / e.setsCompleted)} sn` : `${Math.round(e.repsCompleted / e.setsCompleted)} tekrar`}
                </Text>
              </View>
              <CheckCircle2 color={colors.accent} size={18} />
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Ana Sayfaya Dön"
          icon={<Home color={colors.onPrimary} size={18} />}
          onPress={() => router.replace('/(tabs)')}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  checkWrap: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: 4,
  },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: fonts.bodyMd, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  listTitle: {
    fontFamily: fonts.displayMd,
    fontSize: 19,
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  exBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  exName: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  exMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
