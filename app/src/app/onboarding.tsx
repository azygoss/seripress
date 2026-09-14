import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  Circle,
  Dumbbell,
  Flame,
  Heart,
  Home,
  Mars,
  Minus,
  Plus,
  Shuffle,
  Target,
  Venus,
  Zap,
} from 'lucide-react-native';
import { GENDERS, GOALS, LEVELS, LOCATIONS, type GoalId, type LevelId } from '../data/labels';
import { useAppStore, type Gender, type LocationPref } from '../store/appStore';
import { useI18n } from '../i18n';
import { colors, fonts, radius, spacing } from '../theme';
import { Button, Title } from '../components/ui';

const TOTAL_STEPS = 6;

const GOAL_ICONS: Record<string, React.ReactNode> = {
  muscle: <Dumbbell color={colors.primary} size={24} />,
  fatloss: <Flame color={colors.danger} size={24} />,
  strength: <Zap color={colors.warning} size={24} />,
  general: <Heart color={colors.accent} size={24} />,
};

const GENDER_ICONS: Record<string, React.ReactNode> = {
  female: <Venus color={colors.primary} size={22} />,
  male: <Mars color={colors.info} size={22} />,
  other: <Circle color={colors.textMuted} size={22} />,
};

const LOCATION_ICONS: Record<string, React.ReactNode> = {
  home: <Home color={colors.primary} size={22} />,
  gym: <Dumbbell color={colors.accent} size={22} />,
  anywhere: <Shuffle color={colors.info} size={22} />,
};

function StepperRow({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperCtrl}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
          accessibilityLabel={`${label} ${t('common.decrease')}`}
        >
          <Minus color={colors.text} size={18} />
        </Pressable>
        <View style={styles.stepValueBox}>
          <Text style={styles.stepValue}>{value}</Text>
          <Text style={styles.stepUnit}>{unit}</Text>
        </View>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
          accessibilityLabel={`${label} ${t('common.increase')}`}
        >
          <Plus color={colors.text} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lo } = useI18n();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [targetWeightKg, setTargetWeightKg] = useState(70);
  const [goal, setGoal] = useState<GoalId>('general');
  const [level, setLevel] = useState<LevelId>('beginner');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [location, setLocation] = useState<LocationPref>('anywhere');

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else {
      completeOnboarding({
        name: name.trim(),
        goal,
        level,
        gender,
        age,
        heightCm,
        weightKg,
        targetWeightKg,
        daysPerWeek,
        preferredLocation: location,
      });
      router.replace('/(tabs)');
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Progress header */}
        <View style={styles.headerRow}>
          {step > 0 ? (
            <Pressable style={styles.backBtn} onPress={back} accessibilityLabel={t('common.back')}>
              <ChevronLeft color={colors.text} size={22} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]}
            />
          </View>
          <Text style={styles.stepCount}>
            {step + 1}/{TOTAL_STEPS}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.stepWrap}>
              <Image source={require('../../assets/splash-icon.png')} style={styles.logo} />
              <Title style={styles.heroTitle}>{t('ob.welcome')}</Title>
              <Text style={styles.desc}>{t('ob.welcomeDesc')}</Text>
              <Text style={styles.fieldLabel}>{t('ob.nameLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('ob.namePlaceholder')}
                placeholderTextColor={colors.textDim}
                value={name}
                onChangeText={setName}
                maxLength={20}
                returnKeyType="done"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepWrap}>
              <Title style={styles.heroTitle}>{t('ob.knowYou')}</Title>
              <Text style={styles.desc}>{t('ob.knowYouDesc')}</Text>

              <Text style={styles.fieldLabel}>{t('ob.gender')}</Text>
              <View style={styles.triRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[styles.triCard, gender === g.id && styles.cardActive]}
                    onPress={() => setGender(g.id)}
                    accessibilityState={{ selected: gender === g.id }}
                  >
                    {GENDER_ICONS[g.id]}
                    <Text style={[styles.triText, gender === g.id && { color: colors.primary }]}>
                      {lo(g)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <StepperRow label={t('ob.age')} value={age} unit={t('ob.ageUnit')} min={13} max={90} onChange={setAge} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepWrap}>
              <Title style={styles.heroTitle}>{t('ob.bodyStats')}</Title>
              <Text style={styles.desc}>{t('ob.bodyStatsDesc')}</Text>

              <StepperRow
                label={t('ob.height')}
                value={heightCm}
                unit="cm"
                min={120}
                max={220}
                onChange={setHeightCm}
              />
              <StepperRow
                label={t('ob.weight')}
                value={weightKg}
                unit="kg"
                min={35}
                max={200}
                onChange={setWeightKg}
              />
              <StepperRow
                label={t('ob.targetWeight')}
                value={targetWeightKg}
                unit="kg"
                min={35}
                max={200}
                onChange={setTargetWeightKg}
              />
              <Text style={styles.hint}>{t('ob.statsHint')}</Text>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepWrap}>
              <Title style={styles.heroTitle}>{t('ob.goalTitle')}</Title>
              <Text style={styles.desc}>{t('ob.goalDesc')}</Text>
              <View style={styles.optGrid}>
                {GOALS.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[styles.optCard, goal === g.id && styles.cardActive]}
                    onPress={() => setGoal(g.id)}
                    accessibilityState={{ selected: goal === g.id }}
                  >
                    {GOAL_ICONS[g.id]}
                    <Text style={[styles.optText, goal === g.id && { color: colors.primary }]}>
                      {lo(g)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepWrap}>
              <Title style={styles.heroTitle}>{t('ob.levelTitle')}</Title>
              <Text style={styles.desc}>{t('ob.levelDesc')}</Text>
              <View style={{ gap: spacing.md }}>
                {LEVELS.map((l) => (
                  <Pressable
                    key={l.id}
                    style={[styles.levelCard, level === l.id && styles.cardActive]}
                    onPress={() => setLevel(l.id)}
                    accessibilityState={{ selected: level === l.id }}
                  >
                    <Text style={[styles.levelText, level === l.id && { color: colors.primary }]}>
                      {lo(l)}
                    </Text>
                    <View style={styles.levelDots}>
                      {LEVELS.slice(0, LEVELS.findIndex((x) => x.id === l.id) + 1).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            { backgroundColor: level === l.id ? colors.primary : colors.border },
                          ]}
                        />
                      ))}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepWrap}>
              <Title style={styles.heroTitle}>{t('ob.planTitle')}</Title>
              <Text style={styles.desc}>{t('ob.planDesc')}</Text>

              <StepperRow
                label={t('ob.daysPerWeek')}
                value={daysPerWeek}
                unit={t('ob.dayUnit')}
                min={1}
                max={7}
                onChange={setDaysPerWeek}
              />

              <Text style={styles.fieldLabel}>{t('ob.where')}</Text>
              <View style={styles.triRow}>
                {LOCATIONS.map((l) => (
                  <Pressable
                    key={l.id}
                    style={[styles.triCard, location === l.id && styles.cardActive]}
                    onPress={() => setLocation(l.id)}
                    accessibilityState={{ selected: location === l.id }}
                  >
                    {LOCATION_ICONS[l.id]}
                    <Text style={[styles.triText, location === l.id && { color: colors.primary }]}>
                      {lo(l)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Target color={colors.primary} size={16} />
                  <Text style={styles.summaryText}>
                    {t('ob.summary1', {
                      goal: lo(GOALS.find((g) => g.id === goal)),
                      level: lo(LEVELS.find((l) => l.id === level)),
                    })}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Calendar color={colors.info} size={16} />
                  <Text style={styles.summaryText}>
                    {t('ob.summary2', {
                      days: daysPerWeek,
                      loc: lo(LOCATIONS.find((l) => l.id === location)).toLowerCase(),
                    })}
                  </Text>
                </View>
                <Text style={styles.summarySub}>
                  {t('ob.summary3', { age, height: heightCm, weight: weightKg, target: targetWeightKg })}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <Button
          title={step === TOTAL_STEPS - 1 ? t('common.start') : t('common.continue')}
          onPress={next}
        />
        {step === 0 && (
          <Pressable onPress={next} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('common.skip')}</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  stepCount: {
    fontFamily: fonts.bodySb,
    fontSize: 13,
    color: colors.textMuted,
    minWidth: 34,
    textAlign: 'right',
  },
  stepWrap: { marginTop: spacing.xxl },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
  },
  heroTitle: { fontSize: 36, lineHeight: 40 },
  desc: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  fieldLabel: {
    fontFamily: fonts.bodySb,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 54,
    color: colors.text,
    fontFamily: fonts.bodyMd,
    fontSize: 16,
  },
  triRow: { flexDirection: 'row', gap: spacing.md },
  triCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  triText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.text },
  cardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  stepperLabel: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  stepperCtrl: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueBox: { flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 72, justifyContent: 'center' },
  stepValue: { fontFamily: fonts.display, fontSize: 30, color: colors.text },
  stepUnit: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  optCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 44,
  },
  optText: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 44,
  },
  levelText: { fontFamily: fonts.bodySb, fontSize: 16, color: colors.text },
  levelDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryText: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  summarySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  skipBtn: { alignItems: 'center', padding: spacing.md, minHeight: 44, justifyContent: 'center' },
  skipText: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textDim },
});
