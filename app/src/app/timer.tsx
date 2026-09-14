import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Minus, Pause, Play, Plus, Timer as TimerIcon, X } from 'lucide-react-native';
import { useI18n } from '../i18n';
import { colors, fonts, radius, spacing } from '../theme';
import { Button, Card } from '../components/ui';
import { fmtDuration } from '../lib/format';

type Mode = 'tabata' | 'emom' | 'amrap';
type TPhase = 'idle' | 'work' | 'rest' | 'done';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode | null>(null);
  const [emomRounds, setEmomRounds] = useState(10);
  const [amrapMin, setAmrapMin] = useState(10);

  const [phase, setPhase] = useState<TPhase>('idle');
  const [left, setLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [paused, setPaused] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    activateKeepAwakeAsync('timer').catch(() => {});
    return () => {
      deactivateKeepAwake('timer');
    };
  }, []);

  const totalRounds = mode === 'tabata' ? 8 : mode === 'emom' ? emomRounds : 1;

  const start = () => {
    if (!mode) return;
    doneRef.current = false;
    setTotalElapsed(0);
    setRound(1);
    setPaused(false);
    setPhase('work');
    setLeft(mode === 'tabata' ? 20 : mode === 'emom' ? 60 : amrapMin * 60);
  };

  const stop = () => {
    setPhase('idle');
    setMode(null);
    setPaused(false);
  };

  useEffect(() => {
    if (phase !== 'work' && phase !== 'rest') return;
    if (paused) return;
    const iv = setInterval(() => {
      setTotalElapsed((e) => e + 1);
      setLeft((l) => {
        if (l > 1) return l - 1;
        clearInterval(iv);
        advance();
        return 0;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, round, mode]);

  const advance = () => {
    if (doneRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mode === 'tabata') {
      if (phase === 'work') {
        setPhase('rest');
        setLeft(10);
      } else if (round >= 8) {
        doneRef.current = true;
        setPhase('done');
      } else {
        setRound((r) => r + 1);
        setPhase('work');
        setLeft(20);
      }
    } else if (mode === 'emom') {
      if (round >= emomRounds) {
        doneRef.current = true;
        setPhase('done');
      } else {
        setRound((r) => r + 1);
        setLeft(60);
      }
    } else {
      doneRef.current = true;
      setPhase('done');
    }
  };

  const phaseColor = phase === 'rest' ? colors.accent : colors.primary;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => (phase === 'idle' || phase === 'done' ? router.back() : stop())}
          style={styles.iconBtn}
          accessibilityLabel={t('common.back')}
        >
          {phase === 'idle' || phase === 'done' ? (
            <ArrowLeft color={colors.text} size={22} />
          ) : (
            <X color={colors.text} size={22} />
          )}
        </Pressable>
        <Text style={styles.headerTitle}>{t('timer.title')}</Text>
        <View style={{ width: 42 }} />
      </View>

      {phase === 'idle' && (
        <View style={styles.modeWrap}>
          <Text style={styles.modeHint}>{t('timer.selectMode')}</Text>

          <Card style={styles.modeCard}>
            <Pressable style={styles.modeRow} onPress={() => { setMode('tabata'); }}>
              <View style={[styles.modeIcon, { backgroundColor: colors.primarySoft }]}>
                <TimerIcon color={colors.primary} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeName}>{t('timer.tabata')}</Text>
                <Text style={styles.modeSub}>{t('timer.tabataSub')}</Text>
              </View>
            </Pressable>
            {mode === 'tabata' && <StartBtn onPress={start} />}

            <View style={styles.modeDivider} />

            <Pressable style={styles.modeRow} onPress={() => setMode('emom')}>
              <View style={[styles.modeIcon, { backgroundColor: colors.accentSoft }]}>
                <TimerIcon color={colors.accent} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeName}>{t('timer.emom')}</Text>
                <Text style={styles.modeSub}>{t('timer.emomSub', { n: emomRounds })}</Text>
              </View>
            </Pressable>
            {mode === 'emom' && (
              <>
                <NumPicker value={emomRounds} min={3} max={30} onChange={setEmomRounds} unit={t('sess.circuit')} />
                <StartBtn onPress={start} />
              </>
            )}

            <View style={styles.modeDivider} />

            <Pressable style={styles.modeRow} onPress={() => setMode('amrap')}>
              <View style={[styles.modeIcon, { backgroundColor: colors.infoSoft }]}>
                <TimerIcon color={colors.info} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeName}>{t('timer.amrap')}</Text>
                <Text style={styles.modeSub}>{t('timer.amrapSub', { n: amrapMin })}</Text>
              </View>
            </Pressable>
            {mode === 'amrap' && (
              <>
                <NumPicker value={amrapMin} min={3} max={40} onChange={setAmrapMin} unit={t('common.minAbbr')} />
                <StartBtn onPress={start} />
              </>
            )}
          </Card>
        </View>
      )}

      {(phase === 'work' || phase === 'rest') && (
        <View style={styles.runWrap}>
          <View style={[styles.phaseBadge, { backgroundColor: phase === 'rest' ? colors.accentSoft : colors.primarySoft }]}>
            <Text style={[styles.phaseText, { color: phaseColor }]}>
              {phase === 'rest' ? t('timer.rest') : t('timer.work')}
            </Text>
          </View>
          <Text style={[styles.bigTime, { color: phaseColor }]}>{fmtDuration(left)}</Text>
          {(mode === 'tabata' || mode === 'emom') && (
            <Text style={styles.roundText}>{t('timer.roundOf', { a: round, b: totalRounds })}</Text>
          )}
          <View style={styles.runControls}>
            <Button
              title={paused ? t('sess.resume') : t('sess.pause')}
              variant="ghost"
              icon={paused ? <Play color={colors.text} size={18} /> : <Pause color={colors.text} size={18} />}
              onPress={() => setPaused((p) => !p)}
            />
            <Button
              title={t('sess.endWorkout')}
              variant="danger"
              icon={<X color={colors.danger} size={18} />}
              onPress={stop}
            />
          </View>
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.runWrap}>
          <Text style={styles.doneTitle}>{t('timer.done')}</Text>
          <Text style={styles.doneSub}>{t('timer.doneSub')}</Text>
          <Text style={styles.doneTime}>{fmtDuration(totalElapsed)}</Text>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            style={{ marginTop: spacing.xl, minWidth: 200 }}
          />
        </View>
      )}
    </View>
  );
}

function StartBtn({ onPress }: { onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Button
      title={t('common.start')}
      icon={<Play color={colors.onPrimary} size={16} fill={colors.onPrimary} />}
      onPress={onPress}
      style={{ marginTop: spacing.sm, marginBottom: spacing.sm, minHeight: 44 }}
    />
  );
}

function NumPicker({ value, min, max, onChange, unit }: { value: number; min: number; max: number; onChange: (v: number) => void; unit: string }) {
  const { t } = useI18n();
  return (
    <View style={np.row}>
      <Pressable style={np.btn} onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel={t('common.decrease')}>
        <Minus color={colors.text} size={16} />
      </Pressable>
      <Text style={np.val}>{value} <Text style={np.unit}>{unit}</Text></Text>
      <Pressable style={np.btn} onPress={() => onChange(Math.min(max, value + 1))} accessibilityLabel={t('common.increase')}>
        <Plus color={colors.text} size={16} />
      </Pressable>
    </View>
  );
}

const np = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  val: { fontFamily: fonts.displayMd, fontSize: 22, color: colors.text },
  unit: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted },
});

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
  modeWrap: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  modeHint: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  modeCard: { padding: spacing.md },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  modeIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  modeName: { fontFamily: fonts.displayMd, fontSize: 20, color: colors.text, letterSpacing: 0.5 },
  modeSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  modeDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  runWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  phaseBadge: { borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  phaseText: { fontFamily: fonts.displayMd, fontSize: 18, letterSpacing: 2 },
  bigTime: { fontFamily: fonts.display, fontSize: 120, lineHeight: 128, marginTop: spacing.md },
  roundText: { fontFamily: fonts.bodySb, fontSize: 16, color: colors.textMuted, letterSpacing: 1 },
  runControls: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  doneTitle: { fontFamily: fonts.display, fontSize: 36, color: colors.text },
  doneSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  doneTime: { fontFamily: fonts.display, fontSize: 56, color: colors.primary, marginTop: spacing.lg },
});
