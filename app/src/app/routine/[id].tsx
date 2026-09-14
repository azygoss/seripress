import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Dumbbell, Layers, Link2, Pencil, Play, Repeat } from 'lucide-react-native';
import { getExercise } from '../../data/exercises';
import { BODY_PART_TR, LEVELS } from '../../data/labels';
import { PRESET_ROUTINES, routineDesc, routineMinutes, routineName, routineSetCount } from '../../data/programs';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';
import { colors, fonts, radius, spacing } from '../../theme';
import { ExerciseThumb } from '../../components/ExerciseImage';
import { Button, Card, EmptyState } from '../../components/ui';

export default function RoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t, lb, lo, exName } = useI18n();
  const { customRoutines } = useAppStore();
  const [circuit, setCircuit] = useState(false);

  const routine = useMemo(() => {
    return PRESET_ROUTINES.find((r) => r.id === id) ?? customRoutines.find((r) => r.id === id);
  }, [id, customRoutines]);

  if (!routine) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel={t('common.back')}>
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <EmptyState title={t('prog.notFound')} />
      </View>
    );
  }

  const mins = routineMinutes(routine);
  const sets = routineSetCount(routine);
  const restSec = routine.exercises[0]?.restSec ?? 60;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel={t('common.back')}>
            <ArrowLeft color={colors.text} size={22} />
          </Pressable>
          {routine.custom && (
            <Pressable
              onPress={() => router.push({ pathname: '/builder', params: { id: routine.id } })}
              style={styles.back}
              accessibilityLabel={t('common.edit')}
            >
              <Pencil color={colors.text} size={19} />
            </Pressable>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{routineName(routine, lang)}</Text>
          <Text style={styles.desc}>{routineDesc(routine, lang)}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Dumbbell color={colors.primary} size={16} />
              <Text style={styles.metaValue}>{routine.exercises.length}</Text>
              <Text style={styles.metaLabel}>{t('prog.exercise')}</Text>
            </View>
            <View style={styles.metaBox}>
              <Layers color={colors.accent} size={16} />
              <Text style={styles.metaValue}>{sets}</Text>
              <Text style={styles.metaLabel}>{t('prog.sets')}</Text>
            </View>
            <View style={styles.metaBox}>
              <Clock color={colors.info} size={16} />
              <Text style={styles.metaValue}>~{mins}</Text>
              <Text style={styles.metaLabel}>{t('prog.minutes')}</Text>
            </View>
          </View>

          <Text style={styles.listTitle}>{t('prog.exercises')}</Text>
          <Card style={{ paddingVertical: 0, paddingHorizontal: 0 }}>
            {routine.exercises.map((re, i) => {
              const e = getExercise(re.exerciseId);
              if (!e) return null;
              const grouped = re.group != null;
              return (
                <Pressable
                  key={`${re.exerciseId}-${i}`}
                  style={[styles.exRow, i > 0 && styles.exBorder]}
                  onPress={() => router.push(`/exercise/${e.id}`)}
                >
                  <Text style={styles.exIndex}>{i + 1}</Text>
                  <ExerciseThumb id={e.id} size={52} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.exName} numberOfLines={1}>{exName(e)}</Text>
                      {grouped && <Link2 color={colors.accent} size={13} />}
                    </View>
                    <Text style={styles.exMeta}>
                      {t('prog.setsXreps', { sets: re.sets, reps: `${re.reps} ${re.timed ? t('common.sec') : t('common.reps')}` })}{' '}
                      · {re.restSec}{t('common.secAbbr')} {t('common.rest')} · {lb(BODY_PART_TR, e.bodyPart)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>

          {/* Devre modu */}
          <Pressable style={styles.circuitRow} onPress={() => setCircuit((c) => !c)}>
            <View style={[styles.circuitIcon, circuit && { backgroundColor: colors.accentSoft }]}>
              <Repeat color={circuit ? colors.accent : colors.textDim} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.circuitLabel}>{t('sess.circuitMode')}</Text>
              <Text style={styles.circuitSub}>
                {lang === 'en'
                  ? 'Run through every exercise once per round, rest between rounds'
                  : 'Her turda tüm hareketler birer set — dinlenme tur sonunda'}
              </Text>
            </View>
            <View style={[styles.switch, circuit && styles.switchOn]}>
              <View style={[styles.switchKnob, circuit && styles.switchKnobOn]} />
            </View>
          </Pressable>

          <Text style={styles.levelText}>
            {t('prog.levelLine', { level: lo(LEVELS.find((l) => l.id === routine.level)), sec: restSec })}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={t('prog.startWorkout')}
          icon={<Play color={colors.onPrimary} size={18} fill={colors.onPrimary} />}
          onPress={() =>
            router.push({ pathname: `/session/${routine.id}`, params: circuit ? { circuit: '1' } : {} })
          }
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.lg },
  name: { fontFamily: fonts.display, fontSize: 32, color: colors.text, letterSpacing: 0.3 },
  desc: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metaBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 2,
  },
  metaValue: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  metaLabel: { fontFamily: fonts.bodyMd, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  listTitle: {
    fontFamily: fonts.displayMd,
    fontSize: 19,
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: spacing.xl,
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
  exIndex: { fontFamily: fonts.displayMd, fontSize: 18, color: colors.textDim, width: 22, textAlign: 'center' },
  exName: { fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.text },
  exMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  circuitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  circuitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuitLabel: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  circuitSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textDim, marginTop: 2 },
  switch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  switchOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  switchKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textMuted },
  switchKnobOn: { alignSelf: 'flex-end', backgroundColor: colors.onPrimary },
  levelText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
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
