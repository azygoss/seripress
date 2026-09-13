import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Flame, Heart, Zap } from 'lucide-react-native';
import { GOALS, LEVELS, type GoalId, type LevelId } from '../data/labels';
import { useAppStore } from '../store/appStore';
import { colors, fonts, radius, spacing } from '../theme';
import { Button, Title } from '../components/ui';

const GOAL_ICONS: Record<string, React.ReactNode> = {
  muscle: <Dumbbell color={colors.primary} size={26} />,
  fatloss: <Flame color={colors.danger} size={26} />,
  strength: <Zap color={colors.warning} size={26} />,
  general: <Heart color={colors.accent} size={26} />,
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalId>('general');
  const [level, setLevel] = useState<LevelId>('beginner');

  const next = () => {
    if (step < 2) setStep(step + 1);
    else {
      completeOnboarding({ name: name.trim(), goal, level });
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.logoRow}>
        <View style={styles.logo}>
          <Dumbbell color={colors.onPrimary} size={26} />
        </View>
        <Text style={styles.logoText}>SPORAPP</Text>
      </View>

      {step === 0 && (
        <View style={styles.stepWrap}>
          <Title style={{ fontSize: 34 }}>Hoş geldin!</Title>
          <Text style={styles.desc}>
            1.324 egzersizlik animasyonlu kütüphane, hazır programlar ve antrenman takibi — hepsi
            cebinde, tamamen çevrimdışı.
          </Text>
          <Text style={styles.fieldLabel}>Adın (isteğe bağlı)</Text>
          <TextInput
            style={styles.input}
            placeholder="Adını yaz"
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
          <Title style={{ fontSize: 34 }}>Hedefin ne?</Title>
          <Text style={styles.desc}>Sana en uygun programları önerebilmemiz için seç.</Text>
          <View style={styles.optGrid}>
            {GOALS.map((g) => (
              <Pressable
                key={g.id}
                style={[styles.optCard, goal === g.id && styles.optCardActive]}
                onPress={() => setGoal(g.id)}
              >
                {GOAL_ICONS[g.id]}
                <Text style={[styles.optText, goal === g.id && { color: colors.primary }]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepWrap}>
          <Title style={{ fontSize: 34 }}>Seviyen?</Title>
          <Text style={styles.desc}>Antrenman yoğunluğu buna göre ayarlanacak.</Text>
          <View style={{ gap: spacing.md }}>
            {LEVELS.map((l) => (
              <Pressable
                key={l.id}
                style={[styles.levelCard, level === l.id && styles.optCardActive]}
                onPress={() => setLevel(l.id)}
              >
                <Text style={[styles.levelText, level === l.id && { color: colors.primary }]}>{l.label}</Text>
                <View style={styles.levelDots}>
                  {LEVELS.slice(0, LEVELS.findIndex((x) => x.id === l.id) + 1).map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: level === l.id ? colors.primary : colors.border }]}
                    />
                  ))}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.pageDot, i === step && styles.pageDotActive]} />
        ))}
      </View>

      <Button title={step === 2 ? 'Başla' : 'Devam'} onPress={next} />
      {step === 0 && (
        <Pressable onPress={next} style={styles.skipBtn}>
          <Text style={styles.skipText}>Atla</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxxl },
  logo: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: fonts.display, fontSize: 26, color: colors.text, letterSpacing: 1.5 },
  stepWrap: { marginTop: spacing.lg },
  desc: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  fieldLabel: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.textMuted, marginTop: spacing.xxl, marginBottom: spacing.sm },
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
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  optCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  optCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
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
  },
  levelText: { fontFamily: fonts.bodySb, fontSize: 16, color: colors.text },
  levelDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  pageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  pageDotActive: { backgroundColor: colors.primary, width: 22 },
  skipBtn: { alignItems: 'center', padding: spacing.md },
  skipText: { fontFamily: fonts.bodyMd, fontSize: 14, color: colors.textDim },
});
