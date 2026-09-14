import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Clock, Home, Layers, Repeat, Trophy } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';
import { getExercise } from '../data/exercises';
import { PRESET_ROUTINES, routineName } from '../data/programs';
import { useI18n } from '../i18n';
import { colors, fonts, radius, spacing } from '../theme';
import { ExerciseThumb } from '../components/ExerciseImage';
import { Button, Card, EmptyState } from '../components/ui';
import { fmtDuration } from '../lib/format';
import * as Haptics from 'expo-haptics';

export default function SummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t, exName } = useI18n();
  const sessions = useAppStore((s) => s.sessions);

  const session = useMemo(() => sessions.find((s) => s.id === sessionId), [sessions, sessionId]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!session) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title={t('sum.notFound')} />
        <Button title={t('sum.home')} onPress={() => router.replace('/(tabs)')} style={{ marginHorizontal: spacing.xl }} />
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
        <Text style={styles.title}>{t('sum.title')}</Text>
        <Text style={styles.subtitle}>
          {(() => { const r = PRESET_ROUTINES.find((p) => p.id === session.routineId); return r ? routineName(r, lang) : session.routineName; })()}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Clock color={colors.info} size={18} />
            <Text style={styles.statValue}>{fmtDuration(session.durationSec)}</Text>
            <Text style={styles.statLabel}>{t('sum.duration')}</Text>
          </View>
          <View style={styles.statBox}>
            <Layers color={colors.primary} size={18} />
            <Text style={styles.statValue}>{session.totalSets}</Text>
            <Text style={styles.statLabel}>{t('sum.sets')}</Text>
          </View>
          <View style={styles.statBox}>
            <Repeat color={colors.accent} size={18} />
            <Text style={styles.statValue}>{totalReps}</Text>
            <Text style={styles.statLabel}>{t('sum.repsSec')}</Text>
          </View>
        </View>

        {/* Yeni rekorlar */}
        {session.newPrs && session.newPrs.length > 0 && (
          <View style={styles.prBanner}>
            <Trophy color={colors.warning} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.prTitle}>{t('sum.newPr')}</Text>
              <Text style={styles.prSub}>{t('sum.prCount', { n: session.newPrs.length })}</Text>
            </View>
          </View>
        )}

        <Text style={styles.listTitle}>{t('sum.completed')}</Text>
        <Card style={{ padding: 0 }}>
          {session.exercises.map((e, i) => (
            <View key={e.exerciseId} style={[styles.exRow, i > 0 && styles.exBorder]}>
              <ExerciseThumb id={e.exerciseId} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={styles.exName} numberOfLines={1}>
                  {(() => { const ex = getExercise(e.exerciseId); return ex ? exName(ex) : e.name; })()}
                </Text>
                <Text style={styles.exMeta}>
                  {t('sum.exMeta', {
                    sets: e.setsCompleted,
                    reps: `${Math.round(e.repsCompleted / e.setsCompleted)} ${e.timed ? t('common.sec') : t('common.reps')}`,
                  })}
                </Text>
              </View>
              <CheckCircle2 color={colors.accent} size={18} />
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={t('sum.backHome')}
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
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  prTitle: { fontFamily: fonts.displayMd, fontSize: 18, color: colors.warning, letterSpacing: 0.5 },
  prSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
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
