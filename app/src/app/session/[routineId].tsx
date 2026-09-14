import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight, Flag, Minus, Pause, Play, Plus, SkipForward, X } from 'lucide-react-native';
import { getExercise } from '../../data/exercises';
import { BODY_PART_TR } from '../../data/labels';
import { PRESET_ROUTINES, routineName, type Routine, type RoutineExercise } from '../../data/programs';
import { uid, useAppStore, type SessionExerciseLog } from '../../store/appStore';
import { useI18n } from '../../i18n';
import { colors, fonts, radius, spacing } from '../../theme';
import { ExerciseGif } from '../../components/ExerciseImage';
import { fmtDuration } from '../../lib/format';
import { Button, EmptyState } from '../../components/ui';

type Phase = 'work' | 'rest' | 'done';

export default function SessionScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t, lb, exName } = useI18n();
  const { customRoutines, restSec: defaultRest, logSession } = useAppStore();

  const routine: Routine | undefined = useMemo(() => {
    if (routineId?.startsWith('single-')) {
      const exId = routineId.replace('single-', '');
      const e = getExercise(exId);
      if (!e) return undefined;
      const timed = e.target === 'cardiovascular system' || /plank|bridge|stretch/i.test(e.name);
      return {
        id: routineId,
        name: exName(e),
        description: t('sess.singleDesc'),
        level: 'beginner',
        goals: ['general'],
        location: 'anywhere',
        exercises: [{ exerciseId: exId, sets: 3, reps: timed ? 30 : 12, restSec: defaultRest, timed }],
      } as Routine;
    }
    return (
      PRESET_ROUTINES.find((r) => r.id === routineId) ??
      customRoutines.find((r) => r.id === routineId)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, customRoutines, defaultRest, lang]);

  const totalSets = useMemo(
    () => routine?.exercises.reduce((n, e) => n + e.sets, 0) ?? 0,
    [routine]
  );

  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0); // 0-based set within exercise
  const [phase, setPhase] = useState<Phase>('work');
  const [paused, setPaused] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [workLeft, setWorkLeft] = useState<number | null>(null); // timed set countdown
  const [elapsed, setElapsed] = useState(0);
  const [doneSets, setDoneSets] = useState(0);
  const startedAt = useRef(Date.now());
  const logs = useRef<SessionExerciseLog[]>([]);
  const finished = useRef(false);

  const cur: RoutineExercise | undefined = routine?.exercises[exIndex];
  const exercise = cur ? getExercise(cur.exerciseId) : undefined;

  // timed set init
  useEffect(() => {
    if (cur?.timed) setWorkLeft(cur.reps);
    else setWorkLeft(null);
  }, [exIndex, setIndex, cur]);

  useEffect(() => {
    activateKeepAwakeAsync('session').catch(() => {});
    startedAt.current = Date.now();
    return () => {
      deactivateKeepAwake('session');
    };
  }, []);

  const finishWorkout = useCallback(() => {
    if (finished.current || !routine) return;
    finished.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const endedAt = Date.now();
    const log = {
      id: uid(),
      routineId: routine.id,
      routineName: routineName(routine, lang),
      startedAt: startedAt.current,
      endedAt,
      durationSec: Math.max(1, Math.round((endedAt - startedAt.current) / 1000)),
      totalSets: logs.current.reduce((n, l) => n + l.setsCompleted, 0),
      exercises: logs.current,
    };
    logSession(log);
    setPhase('done');
    router.replace({ pathname: '/summary', params: { sessionId: log.id } });
  }, [routine, logSession, router, lang]);

  const completeSet = useCallback(() => {
    if (!routine || !cur || !exercise) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDoneSets((d) => d + 1);

    const existing = logs.current.find((l) => l.exerciseId === exercise.id);
    if (existing) {
      existing.setsCompleted += 1;
      existing.repsCompleted += cur.reps;
    } else {
      logs.current.push({
        exerciseId: exercise.id,
        name: exName(exercise),
        setsCompleted: 1,
        repsCompleted: cur.reps,
        timed: !!cur.timed,
      });
    }

    const lastSetOfExercise = setIndex + 1 >= cur.sets;
    const lastExercise = exIndex + 1 >= routine.exercises.length;

    if (lastSetOfExercise && lastExercise) {
      finishWorkout();
      return;
    }
    const rest = cur.restSec;
    setRestTotal(rest);
    setRestLeft(rest);
    setPhase('rest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine, cur, exercise, setIndex, exIndex, finishWorkout]);

  const onRestEnd = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!routine || !cur) return;
    const lastSetOfExercise = setIndex + 1 >= cur.sets;
    if (lastSetOfExercise) {
      setExIndex((i) => i + 1);
      setSetIndex(0);
    } else {
      setSetIndex((i) => i + 1);
    }
    setPhase('work');
  }, [routine, cur, setIndex]);

  const completeSetRef = useRef(completeSet);
  completeSetRef.current = completeSet;
  const onRestEndRef = useRef(onRestEnd);
  onRestEndRef.current = onRestEnd;

  // tick
  useEffect(() => {
    if (paused || phase === 'done') return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      if (phase === 'rest') {
        setRestLeft((r) => {
          if (r <= 1) {
            clearInterval(t);
            onRestEndRef.current();
            return 0;
          }
          return r - 1;
        });
      } else if (phase === 'work' && workLeft !== null) {
        setWorkLeft((w) => {
          if (w === null) return w;
          if (w <= 1) {
            clearInterval(t);
            completeSetRef.current();
            return 0;
          }
          return w - 1;
        });
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, phase, workLeft !== null]);

  const skipRest = useCallback(() => onRestEnd(), [onRestEnd]);
  const adjustRest = (d: number) => {
    setRestLeft((r) => Math.max(0, r + d));
    setRestTotal((t) => Math.max(1, t + d));
  };

  const quit = useCallback(() => {
    Alert.alert(t('sess.quitTitle'), t('sess.quitMsg'), [
      { text: t('sess.keepGoing'), style: 'cancel' },
      {
        text: t('sess.exitNoSave'),
        style: 'destructive',
        onPress: () => router.back(),
      },
      {
        text: t('sess.saveFinish'),
        onPress: () => {
          if (logs.current.length > 0) finishWorkout();
          else router.back();
        },
      },
    ]);
  }, [router, finishWorkout, t]);

  if (!routine || !cur || !exercise) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title={t('prog.notFound')} />
      </View>
    );
  }

  const progress = totalSets ? doneSets / totalSets : 0;
  const isLastExercise = exIndex === routine.exercises.length - 1;
  const nextEx = !isLastExercise && setIndex + 1 >= cur.sets ? routine.exercises[exIndex + 1] : null;
  const nextExercise = nextEx ? getExercise(nextEx.exerciseId) : null;

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={quit} style={styles.iconBtn} accessibilityLabel={t('sess.exit')}>
          <X color={colors.text} size={22} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topTitle} numberOfLines={1}>{routineName(routine, lang)}</Text>
          <Text style={styles.topSub}>{fmtDuration(elapsed)}</Text>
        </View>
        <Pressable onPress={() => setPaused((p) => !p)} style={styles.iconBtn} accessibilityLabel={paused ? t('common.continue') : t('sess.pause')}>
          {paused ? <Play color={colors.text} size={20} /> : <Pause color={colors.text} size={20} />}
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {phase === 'work' && (
        <View style={styles.workWrap}>
          <Text style={styles.exCount}>
            {t('sess.exerciseOf', { a: exIndex + 1, b: routine.exercises.length })}
          </Text>
          <View style={styles.gifBox}>
            <ExerciseGif id={exercise.id} />
          </View>
          <Text style={styles.exName}>{exName(exercise)}</Text>
          <Text style={styles.exMeta}>
            {lb(BODY_PART_TR, exercise.bodyPart)} · {t('sess.setOf', { a: setIndex + 1, b: cur.sets })}
          </Text>

          {cur.timed ? (
            <View style={styles.timerBig}>
              <Text style={styles.timerBigText}>{workLeft ?? cur.reps}</Text>
              <Text style={styles.timerBigLabel}>{t('sess.seconds')}</Text>
            </View>
          ) : (
            <View style={styles.repTarget}>
              <Text style={styles.repTargetNum}>{cur.reps}</Text>
              <Text style={styles.repTargetLabel}>{t('sess.repTarget')}</Text>
            </View>
          )}

          <Button
            title={cur.timed ? t('sess.finishSet') : t('sess.completeSet')}
            icon={<Check color={colors.onPrimary} size={20} />}
            onPress={completeSet}
            style={{ marginTop: spacing.xl }}
          />
          <Pressable onPress={() => router.push(`/exercise/${exercise.id}`)} style={styles.howTo}>
            <Text style={styles.howToText}>{t('sess.howTo')}</Text>
          </Pressable>
        </View>
      )}

      {phase === 'rest' && (
        <View style={styles.restWrap}>
          <Text style={styles.restLabel}>{t('sess.rest')}</Text>
          <Text style={styles.restTime}>{restLeft}</Text>
          <View style={styles.restBar}>
            <View
              style={[
                styles.restFill,
                { width: `${restTotal ? (restLeft / restTotal) * 100 : 0}%` },
              ]}
            />
          </View>
          <View style={styles.restAdj}>
            <Pressable style={styles.adjBtn} onPress={() => adjustRest(-10)} accessibilityLabel={t('sess.minus10')}>
              <Minus color={colors.text} size={20} />
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={skipRest}>
              <SkipForward color={colors.onPrimary} size={20} />
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </Pressable>
            <Pressable style={styles.adjBtn} onPress={() => adjustRest(10)} accessibilityLabel={t('sess.plus10')}>
              <Plus color={colors.text} size={20} />
            </Pressable>
          </View>
          {nextExercise ? (
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>{t('sess.upNext')}</Text>
              <Text style={styles.nextName}>{exName(nextExercise)}</Text>
              <Text style={styles.nextMeta}>
                {t('prog.setsXreps', { sets: nextEx!.sets, reps: `${nextEx!.reps} ${nextEx!.timed ? t('common.sec') : t('common.reps')}` })}
              </Text>
            </View>
          ) : (
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>{t('sess.nextSet')}</Text>
              <Text style={styles.nextName}>{exName(exercise)}</Text>
              <Text style={styles.nextMeta}>
                {t('sess.setOf', { a: setIndex + 2, b: cur.sets })} · {cur.reps} {cur.timed ? t('common.sec') : t('common.reps')}
              </Text>
            </View>
          )}
        </View>
      )}

      {paused && (
        <View style={styles.pausedOverlay}>
          <Pause color={colors.primary} size={44} />
          <Text style={styles.pausedText}>{t('sess.paused')}</Text>
          <Button title={t('sess.resume')} onPress={() => setPaused(false)} style={{ marginTop: spacing.lg }} />
          <Button
            title={t('sess.endWorkout')}
            variant="ghost"
            icon={<Flag color={colors.text} size={16} />}
            onPress={quit}
            style={{ marginTop: spacing.md }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
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
  topTitle: { fontFamily: fonts.displayMd, fontSize: 18, color: colors.text, letterSpacing: 0.4 },
  topSub: { fontFamily: fonts.bodyMd, fontSize: 12, color: colors.primary },
  progressWrap: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  workWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  exCount: { fontFamily: fonts.bodySb, fontSize: 12, color: colors.textDim, letterSpacing: 1.5 },
  gifBox: {
    width: '88%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    marginTop: spacing.md,
  },
  exName: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  exMeta: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  timerBig: { alignItems: 'center', marginTop: spacing.lg },
  timerBigText: { fontFamily: fonts.display, fontSize: 76, color: colors.primary, lineHeight: 80 },
  timerBigLabel: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textMuted },
  repTarget: { alignItems: 'center', marginTop: spacing.lg },
  repTargetNum: { fontFamily: fonts.display, fontSize: 76, color: colors.text, lineHeight: 80 },
  repTargetLabel: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textMuted },
  howTo: { marginTop: spacing.md, padding: spacing.sm },
  howToText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.primary },
  restWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  restLabel: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.textDim, letterSpacing: 2 },
  restTime: { fontFamily: fonts.display, fontSize: 110, color: colors.primary, lineHeight: 116 },
  restBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  restFill: { height: '100%', backgroundColor: colors.accent },
  restAdj: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xl },
  adjBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.full,
  },
  skipText: { fontFamily: fonts.displayMd, fontSize: 18, color: colors.onPrimary, letterSpacing: 0.5 },
  nextBox: { alignItems: 'center', marginTop: spacing.xxl },
  nextLabel: { fontFamily: fonts.bodySb, fontSize: 11, color: colors.textDim, letterSpacing: 1.5 },
  nextName: { fontFamily: fonts.displayMd, fontSize: 22, color: colors.text, marginTop: 2 },
  nextMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,16,23,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pausedText: { fontFamily: fonts.display, fontSize: 30, color: colors.text, marginTop: spacing.md },
});
