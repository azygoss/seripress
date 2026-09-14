import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDown, ArrowLeft, ArrowUp, Minus, Plus, Save, Trash2 } from 'lucide-react-native';
import { getExercise } from '../data/exercises';
import { BODY_PART_TR } from '../data/labels';
import type { RoutineExercise } from '../data/programs';
import { uid, useAppStore } from '../store/appStore';
import { useI18n } from '../i18n';
import { colors, fonts, radius, spacing } from '../theme';
import { ExerciseThumb } from '../components/ExerciseImage';
import { Button, Card, EmptyState } from '../components/ui';

export default function BuilderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lb, exName } = useI18n();
  const { customRoutines, saveCustomRoutine, pendingPick, setPendingPick, restSec } = useAppStore();

  const existing = useMemo(() => customRoutines.find((r) => r.id === id), [id, customRoutines]);

  const [name, setName] = useState(existing?.name ?? '');
  const [exercises, setExercises] = useState<RoutineExercise[]>(existing?.exercises ?? []);

  // picker'dan dönen seçimi yakala
  useEffect(() => {
    if (pendingPick) {
      setExercises((list) => [
        ...list,
        { exerciseId: pendingPick, sets: 3, reps: 12, restSec, timed: false },
      ]);
      setPendingPick(null);
    }
  }, [pendingPick, setPendingPick, restSec]);

  const update = (i: number, patch: Partial<RoutineExercise>) =>
    setExercises((list) => list.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const move = (i: number, dir: -1 | 1) =>
    setExercises((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const remove = (i: number) => setExercises((list) => list.filter((_, j) => j !== i));

  const save = () => {
    if (!name.trim()) {
      Alert.alert(t('bld.nameRequired'), t('bld.nameRequiredMsg'));
      return;
    }
    if (exercises.length === 0) {
      Alert.alert(t('bld.needExercise'), t('bld.needExerciseMsg'));
      return;
    }
    saveCustomRoutine({
      id: existing?.id ?? `custom-${uid()}`,
      name: name.trim(),
      description: t('bld.customDesc'),
      level: 'beginner',
      goals: ['general'],
      location: 'anywhere',
      exercises,
      custom: true,
    });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel={t('common.back')}>
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{existing ? t('bld.edit') : t('bld.new')}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingHorizontal: spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.fieldLabel}>{t('bld.nameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('bld.namePlaceholder')}
          placeholderTextColor={colors.textDim}
          value={name}
          onChangeText={setName}
          maxLength={40}
        />

        <View style={styles.listHead}>
          <Text style={styles.listTitle}>{t('bld.exercises', { n: exercises.length })}</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push({ pathname: '/picker', params: { mode: 'pick' } })}
          >
            <Plus color={colors.onPrimary} size={16} />
            <Text style={styles.addBtnText}>{t('bld.add')}</Text>
          </Pressable>
        </View>

        {exercises.length === 0 ? (
          <EmptyState
            title={t('bld.empty')}
            subtitle={t('bld.emptySub')}
          />
        ) : (
          exercises.map((re, i) => {
            const e = getExercise(re.exerciseId);
            if (!e) return null;
            return (
              <Card key={`${re.exerciseId}-${i}`} style={styles.exCard}>
                <View style={styles.exTop}>
                  <ExerciseThumb id={e.id} size={52} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName} numberOfLines={1}>{exName(e)}</Text>
                    <Text style={styles.exMeta}>{lb(BODY_PART_TR, e.bodyPart)}</Text>
                  </View>
                  <Pressable onPress={() => move(i, -1)} hitSlop={6} style={styles.ordBtn} accessibilityLabel={t('bld.up')}>
                    <ArrowUp color={i === 0 ? colors.border : colors.textMuted} size={16} />
                  </Pressable>
                  <Pressable onPress={() => move(i, 1)} hitSlop={6} style={styles.ordBtn} accessibilityLabel={t('bld.down')}>
                    <ArrowDown color={i === exercises.length - 1 ? colors.border : colors.textMuted} size={16} />
                  </Pressable>
                  <Pressable onPress={() => remove(i)} hitSlop={6} style={styles.ordBtn} accessibilityLabel={t('bld.remove')}>
                    <Trash2 color={colors.danger} size={16} />
                  </Pressable>
                </View>
                <View style={styles.exControls}>
                  <Stepper label={t('bld.sets')} value={re.sets} min={1} max={10} onChange={(v) => update(i, { sets: v })} />
                  <Stepper
                    label={re.timed ? t('bld.secLabel') : t('bld.repsLabel')}
                    value={re.reps}
                    min={re.timed ? 5 : 1}
                    max={re.timed ? 300 : 50}
                    onChange={(v) => update(i, { reps: v })}
                  />
                  <Stepper label={t('bld.restLabel')} value={re.restSec} min={0} max={300} step={10} onChange={(v) => update(i, { restSec: v })} suffix={t('common.secAbbr')} />
                </View>
                <Pressable
                  style={styles.timedToggle}
                  onPress={() => update(i, { timed: !re.timed, reps: re.timed ? 12 : 30 })}
                >
                  <View style={[styles.check, re.timed && styles.checkOn]} />
                  <Text style={styles.timedText}>{t('bld.timed')}</Text>
                </Pressable>
              </Card>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={t('common.save')}
          icon={<Save color={colors.onPrimary} size={18} />}
          onPress={save}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))} accessibilityLabel={`${label} ${t('common.decrease')}`}>
          <Minus color={colors.text} size={14} />
        </Pressable>
        <Text style={styles.stepValue}>
          {value}
          {suffix ?? ''}
        </Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + step))} accessibilityLabel={`${label} ${t('common.increase')}`}>
          <Plus color={colors.text} size={14} />
        </Pressable>
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
    marginBottom: spacing.md,
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
  fieldLabel: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 52,
    color: colors.text,
    fontFamily: fonts.bodyMd,
    fontSize: 16,
  },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  listTitle: { fontFamily: fonts.displayMd, fontSize: 19, color: colors.text, letterSpacing: 0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  addBtnText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.onPrimary },
  exCard: { padding: spacing.md, marginBottom: spacing.md },
  exTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  exName: { fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.text },
  exMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ordBtn: { padding: 6 },
  exControls: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  stepper: { flex: 1 },
  stepperLabel: { fontFamily: fonts.bodyMd, fontSize: 11, color: colors.textDim, textTransform: 'uppercase', marginBottom: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: 4 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  timedToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  check: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  timedText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
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
