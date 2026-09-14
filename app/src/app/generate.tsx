import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Building2,
  Home,
  Link2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  User,
} from 'lucide-react-native';
import { getExercise } from '../data/exercises';
import { BODY_PART_TR } from '../data/labels';
import { routineMinutes, type Routine } from '../data/programs';
import { generateRoutine, type EquipmentScope } from '../lib/generator';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../i18n';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../theme';
import { ExerciseThumb } from '../components/ExerciseImage';
import { Button, Card } from '../components/ui';

const BODY_PARTS = Object.keys(BODY_PART_TR);

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lb, exName } = useI18n();
  const { level, preferredLocation, saveCustomRoutine } = useAppStore();

  const [minutes, setMinutes] = useState(25);
  const [equipment, setEquipment] = useState<EquipmentScope>(
    preferredLocation === 'gym' ? 'gym' : preferredLocation === 'home' ? 'none' : 'basic'
  );
  const [parts, setParts] = useState<string[]>([]);
  const [routine, setRoutine] = useState<Routine | null>(null);

  const togglePart = (p: string) =>
    setParts((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]));

  const generate = () => {
    setRoutine(generateRoutine({ minutes, equipment, bodyParts: parts, level }));
  };

  const start = () => {
    if (!routine) return;
    saveCustomRoutine({ ...routine, custom: true });
    router.replace(`/session/${routine.id}`);
  };

  const save = () => {
    if (!routine) return;
    saveCustomRoutine({ ...routine, custom: true });
    Alert.alert(t('gen.saved'), t('gen.savedMsg'));
  };

  const hasSuperset = routine?.exercises.some((e) => e.group != null);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel={t('common.back')}>
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('gen.title')}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110, paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {!routine ? (
          <>
            <View style={styles.hero}>
              <Sparkles color={colors.primary} size={22} />
              <Text style={styles.heroText}>{t('gen.desc')}</Text>
            </View>

            <Text style={styles.label}>{t('gen.duration')}</Text>
            <View style={styles.durRow}>
              <Pressable style={styles.durBtn} onPress={() => setMinutes((m) => Math.max(10, m - 5))} accessibilityLabel={t('common.decrease')}>
                <Minus color={colors.text} size={20} />
              </Pressable>
              <View style={styles.durMid}>
                <Text style={styles.durValue}>{minutes}</Text>
                <Text style={styles.durUnit}>{t('common.minAbbr')}</Text>
              </View>
              <Pressable style={styles.durBtn} onPress={() => setMinutes((m) => Math.min(60, m + 5))} accessibilityLabel={t('common.increase')}>
                <Plus color={colors.text} size={20} />
              </Pressable>
            </View>
            <View style={styles.durPresets}>
              {[15, 20, 30, 45].map((m) => (
                <Pressable
                  key={m}
                  style={[styles.durPreset, minutes === m && styles.durPresetOn]}
                  onPress={() => setMinutes(m)}
                >
                  <Text style={[styles.durPresetText, minutes === m && { color: colors.onPrimary }]}>
                    {t('gen.minutes', { n: m })}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>{t('gen.equipment')}</Text>
            <View style={styles.eqRow}>
              {(
                [
                  { id: 'none', icon: User, key: 'gen.eqNone', subKey: 'gen.eqNoneSub' },
                  { id: 'basic', icon: Home, key: 'gen.eqBasic', subKey: 'gen.eqBasicSub' },
                  { id: 'gym', icon: Building2, key: 'gen.eqGym', subKey: 'gen.eqGymSub' },
                ] as const
              ).map(({ id, icon: Icon, key, subKey }) => (
                <Pressable
                  key={id}
                  style={[styles.eqCard, equipment === id && styles.eqCardOn]}
                  onPress={() => setEquipment(id)}
                >
                  <Icon color={equipment === id ? colors.onPrimary : colors.textMuted} size={22} />
                  <Text style={[styles.eqLabel, equipment === id && { color: colors.onPrimary }]}>
                    {t(key)}
                  </Text>
                  <Text style={[styles.eqSub, equipment === id && { color: colors.onPrimary, opacity: 0.75 }]}>
                    {t(subKey)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('gen.areas')}</Text>
              <Pressable onPress={() => setParts(parts.length ? [] : BODY_PARTS)} hitSlop={8}>
                <Text style={styles.labelAction}>
                  {parts.length ? t('common.clear') : t('common.all')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.partsWrap}>
              {BODY_PARTS.map((p) => {
                const active = parts.length === 0 || parts.includes(p);
                const c = BODY_PART_COLORS[p] ?? colors.primary;
                return (
                  <Pressable
                    key={p}
                    style={[
                      styles.partChip,
                      active && { backgroundColor: c, borderColor: c },
                    ]}
                    onPress={() => togglePart(p)}
                  >
                    <Text style={[styles.partChipText, active && { color: colors.onPrimary }]}>
                      {lb(BODY_PART_TR, p)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.partsHint}>
              {parts.length === 0 ? t('gen.areasAll') : t('common.moveCount', { n: parts.length })}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.resultHead}>
              <Text style={styles.resultTitle}>{t('gen.yourWorkout')}</Text>
              <Text style={styles.resultSub}>
                {t('gen.yourWorkoutSub', { ex: routine.exercises.length, min: routineMinutes(routine) })}
                {hasSuperset ? ` · ${t('gen.supersetNote')}` : ''}
              </Text>
            </View>
            <Card style={{ padding: 0 }}>
              {routine.exercises.map((re, i) => {
                const e = getExercise(re.exerciseId);
                if (!e) return null;
                const inGroup = re.group != null;
                return (
                  <View key={`${re.exerciseId}-${i}`} style={[styles.exRow, i > 0 && styles.exBorder]}>
                    <Text style={styles.exIndex}>{i + 1}</Text>
                    <ExerciseThumb id={e.id} size={48} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.exName} numberOfLines={1}>{exName(e)}</Text>
                        {inGroup && <Link2 color={colors.accent} size={13} />}
                      </View>
                      <Text style={styles.exMeta}>
                        {re.sets} × {re.reps} {re.timed ? t('common.sec') : t('common.reps')} · {lb(BODY_PART_TR, e.bodyPart)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {!routine ? (
          <Button
            title={t('gen.generate')}
            icon={<Sparkles color={colors.onPrimary} size={18} />}
            onPress={generate}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              title={t('gen.regenerate')}
              variant="ghost"
              icon={<RefreshCw color={colors.text} size={16} />}
              onPress={generate}
              style={{ minHeight: 52 }}
            />
            <Button
              title={t('gen.save')}
              variant="outline"
              icon={<Save color={colors.text} size={16} />}
              onPress={save}
              style={{ minHeight: 52 }}
            />
            <Button
              title={t('gen.startNow')}
              icon={<Play color={colors.onPrimary} size={16} fill={colors.onPrimary} />}
              onPress={start}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>
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
  hero: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroText: { flex: 1, fontFamily: fonts.bodyMd, fontSize: 14, color: colors.text, lineHeight: 20 },
  label: { fontFamily: fonts.displayMd, fontSize: 18, color: colors.text, letterSpacing: 0.5, marginBottom: spacing.md, textTransform: 'uppercase' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelAction: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.primary, marginBottom: spacing.md },
  durRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  durBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durMid: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  durValue: { fontFamily: fonts.display, fontSize: 56, color: colors.text, lineHeight: 60 },
  durUnit: { fontFamily: fonts.bodySb, fontSize: 16, color: colors.textMuted, marginTop: 18 },
  durPresets: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  durPreset: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  durPresetOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  durPresetText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.textMuted },
  eqRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  eqCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 5,
  },
  eqCardOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  eqLabel: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.text },
  eqSub: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textDim, textAlign: 'center' },
  partsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  partChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  partChipText: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted },
  partsHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim, marginTop: spacing.sm },
  resultHead: { alignItems: 'center', marginBottom: spacing.lg },
  resultTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  resultSub: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  exBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  exIndex: { fontFamily: fonts.displayMd, fontSize: 17, color: colors.textDim, width: 20, textAlign: 'center' },
  exName: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text, flexShrink: 1 },
  exMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
