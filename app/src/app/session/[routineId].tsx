import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Check, Flag, Link2, Minus, Pause, Play, Plus, RefreshCw, Repeat, SkipForward, X } from 'lucide-react-native';
import { EXERCISES, getExercise } from '../../data/exercises';
import { BODY_PART_TR } from '../../data/labels';
import { PRESET_ROUTINES, routineName, type Routine, type RoutineExercise } from '../../data/programs';
import { lastWeight } from '../../lib/stats';
import { uid, useAppStore, type SessionExerciseLog } from '../../store/appStore';
import { useI18n } from '../../i18n';
import { colors, fonts, radius, spacing } from '../../theme';
import { ExerciseGif, ExerciseThumb } from '../../components/ExerciseImage';
import { fmtDuration } from '../../lib/format';
import { Button, EmptyState } from '../../components/ui';

type Phase = 'work' | 'rest' | 'done';

/** Kuyruktaki bir çalışma adımı — hangi egzersizin hangi turu */
interface Step {
  exIdx: number;
  block: number;
  round: number;
  /** Blok bu turda kaç egzersiz içeriyor */
  roundLen: number;
  totalRounds: number;
  inGroup: boolean;
}

/**
 * Çalışma sırası:
 * - normal: her set kendi başına (set → dinlenme → set)
 * - superset (group): aynı grup ardışık egzersizler tur tur dönüşür, dinlenme tur sonunda
 * - devre: tüm program tek blok, her turda her egzersiz bir set
 */
function buildQueue(exs: RoutineExercise[], circuit: boolean): Step[] {
  const steps: Step[] = [];
  let blockId = 0;
  const pushBlock = (idxs: number[]) => {
    const totalRounds = Math.max(...idxs.map((i) => exs[i].sets));
    for (let r = 0; r < totalRounds; r++) {
      const members = idxs.filter((i) => exs[i].sets > r);
      for (const i of members) {
        steps.push({
          exIdx: i,
          block: blockId,
          round: r,
          roundLen: members.length,
          totalRounds,
          inGroup: idxs.length > 1,
        });
      }
    }
    blockId++;
  };

  if (circuit) {
    pushBlock(exs.map((_, i) => i));
    return steps;
  }
  let i = 0;
  while (i < exs.length) {
    const g = exs[i].group;
    if (g != null && i + 1 < exs.length && exs[i + 1].group === g) {
      const idxs = [i];
      let j = i + 1;
      while (j < exs.length && exs[j].group === g) idxs.push(j++);
      pushBlock(idxs);
      i = j;
    } else {
      pushBlock([i]);
      i++;
    }
  }
  return steps;
}

/** Ağırlık girişi gösterilen ekipmanlar */
const WEIGHTED = new Set([
  'barbell',
  'dumbbell',
  'kettlebell',
  'ez barbell',
  'olympic barbell',
  'trap bar',
  'cable',
  'leverage machine',
  'smith machine',
  'sled machine',
  'hammer',
  'weighted',
  'tire',
  'sled machine',
]);

export default function SessionScreen() {
  const { routineId, circuit: circuitParam } = useLocalSearchParams<{ routineId: string; circuit?: string }>();
  const circuit = circuitParam === '1';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t, lb, exName } = useI18n();
  const { customRoutines, restSec: defaultRest, logSession, recordPR, sessions, prs } = useAppStore();

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

  // çalışma listesi — değiştirme (swap) yapılabilmesi için state kopyası
  const [exs, setExs] = useState<RoutineExercise[] | null>(null);
  useEffect(() => {
    if (routine && exs === null) setExs(routine.exercises);
  }, [routine, exs]);

  const queue = useMemo(() => (exs ? buildQueue(exs, circuit) : []), [exs, circuit]);
  const totalSteps = queue.length;

  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [paused, setPaused] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [workLeft, setWorkLeft] = useState<number | null>(null); // timed set countdown
  const [elapsed, setElapsed] = useState(0);
  const [doneSteps, setDoneSteps] = useState(0);
  const [donePerEx, setDonePerEx] = useState<number[]>([]);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [swapOpen, setSwapOpen] = useState(false);
  const startedAt = useRef(Date.now());
  const logs = useRef<SessionExerciseLog[]>([]);
  const finished = useRef(false);

  const step: Step | undefined = queue[stepIdx];
  const nextStep: Step | undefined = queue[stepIdx + 1];
  const cur: RoutineExercise | undefined = step ? exs?.[step.exIdx] : undefined;
  const exercise = cur ? getExercise(cur.exerciseId) : undefined;
  const curSetNo = step ? (donePerEx[step.exIdx] ?? 0) + 1 : 1;

  const showWeight = !!exercise && WEIGHTED.has(exercise.equipment) && !cur?.timed;
  const prevWeight = exercise ? lastWeight(sessions, exercise.id) : null;
  const curWeight = step ? weights[step.exIdx] ?? 0 : 0;

  // yeni egzersize geçince ağırlığı son kayıttan doldur
  useEffect(() => {
    if (!step || !exercise || !showWeight) return;
    setWeights((w) =>
      w[step.exIdx] != null ? w : { ...w, [step.exIdx]: prevWeight ?? prs[exercise.id]?.weight ?? 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, exercise?.id, showWeight]);

  // timed set init
  useEffect(() => {
    if (cur?.timed) setWorkLeft(cur.reps);
    else setWorkLeft(null);
  }, [stepIdx, cur]);

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

    // PR değerlendirmesi
    const newPrs: string[] = [];
    for (const l of logs.current) {
      const w = l.weights?.filter((x): x is number => x != null && x > 0);
      if (!w?.length) continue;
      const best = Math.max(...w);
      const repsPerSet = Math.max(1, Math.round(l.repsCompleted / l.setsCompleted));
      if (recordPR(l.exerciseId, best, repsPerSet)) newPrs.push(l.exerciseId);
    }

    const log = {
      id: uid(),
      routineId: routine.id,
      routineName: routineName(routine, lang),
      startedAt: startedAt.current,
      endedAt,
      durationSec: Math.max(1, Math.round((endedAt - startedAt.current) / 1000)),
      totalSets: logs.current.reduce((n, l) => n + l.setsCompleted, 0),
      exercises: logs.current,
      newPrs,
    };
    logSession(log);
    setPhase('done');
    router.replace({ pathname: '/summary', params: { sessionId: log.id } });
  }, [routine, logSession, router, lang, recordPR]);

  const completeSet = useCallback(() => {
    if (!routine || !cur || !exercise || !step) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDoneSteps((d) => d + 1);
    setDonePerEx((d) => {
      const copy = [...d];
      copy[step.exIdx] = (copy[step.exIdx] ?? 0) + 1;
      return copy;
    });

    const w = weights[step.exIdx];
    const existing = logs.current.find((l) => l.exerciseId === exercise.id);
    if (existing) {
      existing.setsCompleted += 1;
      existing.repsCompleted += cur.reps;
      existing.weights = [...(existing.weights ?? []), w != null && w > 0 ? w : null];
    } else {
      logs.current.push({
        exerciseId: exercise.id,
        name: exName(exercise),
        setsCompleted: 1,
        repsCompleted: cur.reps,
        timed: !!cur.timed,
        weights: [w != null && w > 0 ? w : null],
      });
    }

    const isLast = stepIdx + 1 >= queue.length;
    if (isLast) {
      finishWorkout();
      return;
    }
    // superset/devre içinde aynı tur devam ediyorsa dinlenme yok
    const nxt = queue[stepIdx + 1];
    const noRest = nxt.block === step.block && nxt.round === step.round;
    if (noRest) {
      setStepIdx((i) => i + 1);
      return;
    }
    const rest = cur.restSec;
    setRestTotal(rest);
    setRestLeft(rest);
    setPhase('rest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine, cur, exercise, step, stepIdx, queue, weights, finishWorkout]);

  const onRestEnd = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStepIdx((i) => i + 1);
    setPhase('work');
  }, []);

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

  const swapExercise = useCallback(
    (newId: string) => {
      if (!step) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExs((list) => {
        if (!list) return list;
        const copy = [...list];
        copy[step.exIdx] = { ...copy[step.exIdx], exerciseId: newId };
        return copy;
      });
      // eski egzersizin ağırlık/set sayacını temizle
      setDonePerEx((d) => {
        const copy = [...d];
        copy[step.exIdx] = 0;
        return copy;
      });
      setWeights((w) => {
        const copy = { ...w };
        delete copy[step.exIdx];
        return copy;
      });
      setSwapOpen(false);
    },
    [step]
  );

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

  const swapCandidates = useMemo(() => {
    if (!exercise || !exs) return [];
    const used = new Set(exs.map((e) => e.exerciseId));
    return EXERCISES.filter(
      (e) => e.bodyPart === exercise.bodyPart && !used.has(e.id)
    )
      .sort(
        (a, b) =>
          Number(b.equipment === exercise.equipment) - Number(a.equipment === exercise.equipment) ||
          Number(b.target === exercise.target) - Number(a.target === exercise.target)
      )
      .slice(0, 24);
  }, [exercise, exs]);

  if (!routine || !step || !cur || !exercise) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title={t('prog.notFound')} />
      </View>
    );
  }

  const progress = totalSteps ? doneSteps / totalSteps : 0;
  const nextCur = nextStep ? exs?.[nextStep.exIdx] : null;
  const nextExercise = nextCur ? getExercise(nextCur.exerciseId) : null;
  const hasPr = !!prs[exercise.id];

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
          <View style={styles.badgeRow}>
            <Text style={styles.exCount}>
              {t('sess.exerciseOf', { a: step.exIdx + 1, b: exs!.length })}
            </Text>
            {circuit && (
              <View style={styles.modeBadge}>
                <Repeat color={colors.accent} size={11} />
                <Text style={[styles.modeBadgeText, { color: colors.accent }]}>
                  {t('sess.round', { a: step.round + 1, b: step.totalRounds })}
                </Text>
              </View>
            )}
            {!circuit && step.inGroup && (
              <View style={styles.modeBadge}>
                <Link2 color={colors.accent} size={11} />
                <Text style={[styles.modeBadgeText, { color: colors.accent }]}>
                  {t('sess.superset')} · {t('sess.round', { a: step.round + 1, b: step.totalRounds })}
                </Text>
              </View>
            )}
            {hasPr && (
              <View style={styles.modeBadge}>
                <Text style={styles.prBadgeText}>{t('sess.prBadge')}</Text>
              </View>
            )}
          </View>
          <View style={styles.gifBox}>
            <ExerciseGif id={exercise.id} />
          </View>
          <Text style={styles.exName}>{exName(exercise)}</Text>
          <Text style={styles.exMeta}>
            {lb(BODY_PART_TR, exercise.bodyPart)} · {t('sess.setOf', { a: curSetNo, b: cur.sets })}
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

          {showWeight && (
            <View style={styles.weightRow}>
              <Pressable
                style={styles.weightBtn}
                onPress={() =>
                  setWeights((w) => ({ ...w, [step.exIdx]: Math.max(0, (w[step.exIdx] ?? 0) - 2.5) }))
                }
                accessibilityLabel={`${t('sess.weight')} ${t('common.decrease')}`}
              >
                <Minus color={colors.text} size={18} />
              </Pressable>
              <View style={styles.weightMid}>
                <Text style={styles.weightValue}>
                  {curWeight}
                  <Text style={styles.weightUnit}> {t('sess.kg')}</Text>
                </Text>
                <Text style={styles.weightHint}>
                  {prevWeight != null
                    ? t('sess.suggestedWeight', { kg: +(prevWeight + 2.5).toFixed(1) })
                    : t('sess.weight')}
                </Text>
              </View>
              <Pressable
                style={styles.weightBtn}
                onPress={() =>
                  setWeights((w) => ({ ...w, [step.exIdx]: Math.min(400, (w[step.exIdx] ?? 0) + 2.5) }))
                }
                accessibilityLabel={`${t('sess.weight')} ${t('common.increase')}`}
              >
                <Plus color={colors.text} size={18} />
              </Pressable>
            </View>
          )}

          <Button
            title={cur.timed ? t('sess.finishSet') : t('sess.completeSet')}
            icon={<Check color={colors.onPrimary} size={20} />}
            onPress={completeSet}
            style={{ marginTop: spacing.lg }}
          />
          <View style={styles.linkRow}>
            <Pressable onPress={() => router.push(`/exercise/${exercise.id}`)} style={styles.linkBtn}>
              <Text style={styles.howToText}>{t('sess.howTo')}</Text>
            </Pressable>
            <Pressable onPress={() => setSwapOpen(true)} style={styles.linkBtn}>
              <RefreshCw color={colors.primary} size={14} />
              <Text style={styles.howToText}>{t('sess.swap')}</Text>
            </Pressable>
          </View>
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
          {nextExercise && nextCur ? (
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>{t('sess.upNext')}</Text>
              <Text style={styles.nextName}>{exName(nextExercise)}</Text>
              <Text style={styles.nextMeta}>
                {t('prog.setsXreps', { sets: nextCur.sets, reps: `${nextCur.reps} ${nextCur.timed ? t('common.sec') : t('common.reps')}` })}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Egzersiz değiştirme */}
      <Modal visible={swapOpen} transparent animationType="slide" onRequestClose={() => setSwapOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSwapOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.modalTitle}>{t('sess.swapTitle')}</Text>
          <FlatList
            data={swapCandidates}
            keyExtractor={(e) => e.id}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => (
              <Pressable style={styles.swapRow} onPress={() => swapExercise(item.id)}>
                <ExerciseThumb id={item.id} size={48} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.swapName} numberOfLines={1}>{exName(item)}</Text>
                  <Text style={styles.swapMeta}>
                    {lb(BODY_PART_TR, item.bodyPart)} · {item.equipment}
                  </Text>
                </View>
                <RefreshCw color={colors.primary} size={16} />
              </Pressable>
            )}
          />
        </View>
      </Modal>

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
  workWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 24 },
  exCount: { fontFamily: fonts.bodySb, fontSize: 12, color: colors.textDim, letterSpacing: 1.5 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modeBadgeText: { fontFamily: fonts.bodySb, fontSize: 10, letterSpacing: 1 },
  prBadgeText: { fontFamily: fonts.bodySb, fontSize: 10, letterSpacing: 1, color: colors.primary },
  gifBox: {
    width: '82%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    marginTop: spacing.sm,
  },
  exName: {
    fontFamily: fonts.display,
    fontSize: 25,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  exMeta: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  timerBig: { alignItems: 'center', marginTop: spacing.md },
  timerBigText: { fontFamily: fonts.display, fontSize: 68, color: colors.primary, lineHeight: 72 },
  timerBigLabel: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textMuted },
  repTarget: { alignItems: 'center', marginTop: spacing.md },
  repTargetNum: { fontFamily: fonts.display, fontSize: 68, color: colors.text, lineHeight: 72 },
  repTargetLabel: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textMuted },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  weightBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightMid: { alignItems: 'center', minWidth: 90 },
  weightValue: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  weightUnit: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted },
  weightHint: { fontFamily: fonts.body, fontSize: 11, color: colors.primary, marginTop: -2 },
  linkRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalTitle: { fontFamily: fonts.displayMd, fontSize: 22, color: colors.text, marginBottom: spacing.md },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  swapName: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  swapMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
