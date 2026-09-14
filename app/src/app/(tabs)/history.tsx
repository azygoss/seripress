import React, { useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarCheck, Clock, Flame, Layers, Trash2 } from 'lucide-react-native';
import {
  streakDays,
  totalMinutes,
  totalSets,
  totalWorkouts,
  useAppStore,
  weekActivity,
  type SessionLog,
} from '../../store/appStore';
import { colors, fonts, radius, spacing } from '../../theme';
import { ExerciseThumb } from '../../components/ExerciseImage';
import { EmptyState, StatTile, Title } from '../../components/ui';
import { fmtTime, relDay } from '../../lib/format';
import { fmtDuration } from '../../lib/format';
import { PRESET_ROUTINES, routineName } from '../../data/programs';
import { useI18n } from '../../i18n';

/** Kayıt zamanındaki isim yerine preset programları aktif dile çevir */
const sessionName = (s: SessionLog, lang: 'tr' | 'en') => {
  const preset = PRESET_ROUTINES.find((r) => r.id === s.routineId);
  return preset ? routineName(preset, lang) : s.routineName;
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { lang, t } = useI18n();
  const { sessions, deleteSession } = useAppStore();

  const week = useMemo(() => weekActivity(sessions, lang), [sessions, lang]);
  const maxMin = Math.max(...week.map((d) => d.minutes), 1);

  const sections = useMemo(() => {
    const groups = new Map<string, SessionLog[]>();
    for (const s of sessions) {
      const k = relDay(s.endedAt, lang);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(s);
    }
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [sessions, lang]);

  const confirmDelete = (s: SessionLog) =>
    Alert.alert(t('hist.deleteTitle'), t('hist.deleteMsg', { name: sessionName(s, lang) }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteSession(s.id) },
    ]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View>
            <Title>{t('hist.title')}</Title>
            <View style={styles.statsRow}>
              <StatTile value={streakDays(sessions)} label={t('home.streak')} color={colors.primary} icon={<Flame color={colors.primary} size={18} />} />
              <View style={{ width: spacing.md }} />
              <StatTile value={totalWorkouts(sessions)} label={t('home.workouts')} icon={<CalendarCheck color={colors.accent} size={18} />} />
              <View style={{ width: spacing.md }} />
              <StatTile value={totalMinutes(sessions)} label={t('home.minutes')} icon={<Clock color={colors.info} size={18} />} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.md }]}>
              <StatTile value={totalSets(sessions)} label={t('hist.totalSets')} icon={<Layers color={colors.warning} size={18} />} />
            </View>

            <Text style={styles.weekTitle}>{t('hist.last7')}</Text>
            <View style={styles.weekCard}>
              {week.map((d) => (
                <View key={d.label} style={styles.weekCol}>
                  <Text style={styles.weekMin}>{d.minutes > 0 ? d.minutes : ''}</Text>
                  <View style={styles.weekBarWrap}>
                    <View
                      style={[
                        styles.weekBar,
                        {
                          height: Math.max(4, (d.minutes / maxMin) * 56),
                          backgroundColor: d.isToday ? colors.primary : d.minutes > 0 ? colors.accent : colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.weekLabel, d.isToday && { color: colors.primary }]}>{d.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.weekTitle}>{t('hist.workouts')}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.dayHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.sessionCard}>
            <ExerciseThumb id={item.exercises[0]?.exerciseId ?? '0001'} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionName} numberOfLines={1}>{sessionName(item, lang)}</Text>
              <Text style={styles.sessionMeta}>
                {t('hist.sessionMeta', {
                  time: fmtTime(item.endedAt),
                  dur: fmtDuration(item.durationSec),
                  sets: item.totalSets,
                  ex: item.exercises.length,
                })}
              </Text>
            </View>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={8} accessibilityLabel={t('hist.deleteRecord')} style={{ padding: 4 }}>
              <Trash2 color={colors.textDim} size={17} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<CalendarCheck color={colors.textDim} size={40} />}
            title={t('hist.empty')}
            subtitle={t('hist.emptySub')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  statsRow: { flexDirection: 'row', marginTop: spacing.md },
  weekTitle: {
    fontFamily: fonts.displayMd,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  weekCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  weekCol: { alignItems: 'center', flex: 1 },
  weekMin: { fontFamily: fonts.bodySb, fontSize: 10, color: colors.textMuted, height: 14 },
  weekBarWrap: { height: 56, justifyContent: 'flex-end' },
  weekBar: { width: 18, borderRadius: 6 },
  weekLabel: { fontFamily: fonts.bodyMd, fontSize: 11, color: colors.textMuted, marginTop: 6 },
  dayHeader: {
    fontFamily: fonts.bodySb,
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionName: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  sessionMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
