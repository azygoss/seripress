import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BarChart3, BatteryCharging, BatteryLow, BatteryMedium } from 'lucide-react-native';
import { BODY_PART_TR } from '../data/labels';
import { muscleRecovery, weeklyTarget, weeklyVolume } from '../lib/stats';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../i18n';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../theme';
import { Card, EmptyState } from '../components/ui';

const STATUS_COLOR = { fresh: colors.accent, recovering: colors.warning, strained: colors.danger } as const;
const STATUS_ICON = { fresh: BatteryCharging, recovering: BatteryMedium, strained: BatteryLow } as const;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lb } = useI18n();
  const { sessions, level } = useAppStore();

  const volume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const recovery = useMemo(() => muscleRecovery(sessions), [sessions]);
  const target = weeklyTarget(level);
  const maxSets = Math.max(target.max, ...volume.values(), 1);

  const ago = (h: number) =>
    h >= 24
      ? t('stats.daysAgo', { d: Math.floor(h / 24) })
      : t('stats.hoursAgo', { h: Math.max(1, Math.round(h)) });

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel={t('common.back')}>
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('stats.title')}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <EmptyState
            icon={<BarChart3 color={colors.textDim} size={40} />}
            title={t('stats.empty')}
            subtitle={t('stats.emptySub')}
          />
        ) : (
          <>
            {/* Haftalık hacim */}
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionTitle}>{t('stats.volume')}</Text>
                <Text style={styles.sectionSub}>
                  {t('stats.volumeSub')} · {t('stats.target', { min: target.min, max: target.max })}
                </Text>
              </View>
            </View>
            <Card style={{ paddingVertical: spacing.md }}>
              {Object.keys(BODY_PART_TR).map((bp) => {
                const sets = volume.get(bp) ?? 0;
                if (sets === 0) return null;
                const c = BODY_PART_COLORS[bp] ?? colors.primary;
                const inRange = sets >= target.min && sets <= target.max;
                const over = sets > target.max;
                return (
                  <View key={bp} style={styles.volRow}>
                    <Text style={styles.volLabel} numberOfLines={1}>{lb(BODY_PART_TR, bp)}</Text>
                    <View style={styles.volTrack}>
                      {/* hedef aralığı işaret bandı */}
                      <View
                        style={[
                          styles.volTargetBand,
                          {
                            left: `${(target.min / maxSets) * 100}%`,
                            width: `${((target.max - target.min) / maxSets) * 100}%`,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.volFill,
                          {
                            width: `${Math.min(100, (sets / maxSets) * 100)}%`,
                            backgroundColor: over ? colors.warning : c,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.volValue,
                        inRange && { color: colors.accent },
                        over && { color: colors.warning },
                      ]}
                    >
                      {sets}
                    </Text>
                  </View>
                );
              })}
              {volume.size === 0 && (
                <Text style={styles.volEmpty}>{t('stats.empty')}</Text>
              )}
            </Card>

            {/* Dinlenme durumu */}
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionTitle}>{t('stats.recovery')}</Text>
                <Text style={styles.sectionSub}>{t('stats.recoverySub')}</Text>
              </View>
            </View>
            <Card style={{ padding: 0 }}>
              {recovery.map((r, i) => {
                const Icon = STATUS_ICON[r.status];
                const c = STATUS_COLOR[r.status];
                return (
                  <View key={r.bodyPart} style={[styles.recRow, i > 0 && styles.recBorder]}>
                    <View style={[styles.recDot, { backgroundColor: c }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recName}>{lb(BODY_PART_TR, r.bodyPart)}</Text>
                      <Text style={styles.recAgo}>{ago(r.hoursAgo)}</Text>
                    </View>
                    <View style={styles.recStatus}>
                      <Icon color={c} size={16} />
                      <Text style={[styles.recStatusText, { color: c }]}>{t(`stats.${r.status}`)}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.displayMd, fontSize: 22, color: colors.text },
  sectionHead: { marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.displayMd, fontSize: 19, color: colors.text, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 7 },
  volLabel: { width: 88, fontFamily: fonts.bodyMd, fontSize: 12.5, color: colors.textMuted },
  volTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  volTargetBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(34,197,94,0.18)',
  },
  volFill: { height: '100%', borderRadius: 5 },
  volValue: { width: 28, textAlign: 'right', fontFamily: fonts.bodySb, fontSize: 13, color: colors.text },
  volEmpty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  recBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  recName: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  recAgo: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim, marginTop: 1 },
  recStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recStatusText: { fontFamily: fonts.bodySb, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
});
