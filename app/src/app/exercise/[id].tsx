import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Dumbbell, Heart, Layers, Play, Plus, Target } from 'lucide-react-native';
import { EXERCISES, getExercise } from '../../data/exercises';
import { BODY_PART_TR, EQUIPMENT_TR, MUSCLE_TR, TARGET_TR, tr } from '../../data/labels';
import { useAppStore } from '../../store/appStore';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../../theme';
import { ExerciseGif, ExerciseThumb } from '../../components/ExerciseImage';
import { Button, Card, Chip, EmptyState, SectionHeader } from '../../components/ui';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites, toggleFavorite, instructionLang } = useAppStore();
  const [showAllSteps, setShowAllSteps] = useState(false);

  const exercise = getExercise(id ?? '');

  const similar = useMemo(() => {
    if (!exercise) return [];
    return EXERCISES.filter(
      (e) => e.id !== exercise.id && e.bodyPart === exercise.bodyPart && e.equipment === exercise.equipment
    ).slice(0, 8);
  }, [exercise]);

  if (!exercise) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState title="Egzersiz bulunamadı" />
      </View>
    );
  }

  const steps = instructionLang === 'tr' && exercise.steps.tr.length ? exercise.steps.tr : exercise.steps.en;
  const isFav = favorites.includes(exercise.id);
  const visibleSteps = showAllSteps ? steps : steps.slice(0, 6);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* GIF hero */}
        <View style={styles.hero}>
          <ExerciseGif id={exercise.id} />
          <Pressable
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
            accessibilityLabel="Geri"
          >
            <ArrowLeft color={colors.text} size={22} />
          </Pressable>
          <Pressable
            style={[styles.favBtn, { top: insets.top + spacing.sm }]}
            onPress={() => toggleFavorite(exercise.id)}
            accessibilityLabel="Favorilere ekle"
          >
            <Heart color={isFav ? colors.danger : colors.text} size={22} fill={isFav ? colors.danger : 'none'} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{exercise.name}</Text>

          <View style={styles.chips}>
            <Chip label={tr(BODY_PART_TR, exercise.bodyPart)} active color={BODY_PART_COLORS[exercise.bodyPart] ?? colors.primary} />
            <Chip label={tr(EQUIPMENT_TR, exercise.equipment)} />
            <Chip label={tr(TARGET_TR, exercise.target)} />
          </View>

          {/* Muscles */}
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.muscleRow}>
              <View style={styles.muscleItem}>
                <View style={styles.muscleIcon}>
                  <Target color={colors.primary} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.muscleLabel}>Birincil Kas</Text>
                  <Text style={styles.muscleValue}>{tr(TARGET_TR, exercise.target)}</Text>
                </View>
              </View>
              <View style={styles.muscleItem}>
                <View style={[styles.muscleIcon, { backgroundColor: colors.infoSoft }]}>
                  <Dumbbell color={colors.info} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.muscleLabel}>Kas Grubu</Text>
                  <Text style={styles.muscleValue}>{tr(MUSCLE_TR, exercise.muscleGroup)}</Text>
                </View>
              </View>
            </View>
            {exercise.secondaryMuscles.length > 0 && (
              <View style={styles.secondaryRow}>
                <Layers color={colors.textDim} size={14} />
                <Text style={styles.secondaryText}>
                  İkincil: {exercise.secondaryMuscles.map((m) => tr(MUSCLE_TR, m)).join(', ')}
                </Text>
              </View>
            )}
          </Card>

          {/* Steps */}
          <SectionHeader title="Nasıl Yapılır" />
          <Card>
            {visibleSteps.map((s, i) => (
              <View key={i} style={[styles.stepRow, i > 0 && styles.stepBorder]}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
            {steps.length > 6 && (
              <Pressable onPress={() => setShowAllSteps((v) => !v)} style={styles.moreBtn}>
                <Text style={styles.moreText}>
                  {showAllSteps ? 'Daha az göster' : `${steps.length - 6} adım daha göster`}
                </Text>
              </Pressable>
            )}
          </Card>

          {/* Similar */}
          {similar.length > 0 && (
            <>
              <SectionHeader title="Benzer Egzersizler" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                {similar.map((e) => (
                  <Pressable key={e.id} style={styles.simCard} onPress={() => router.push(`/exercise/${e.id}`)}>
                    <ExerciseThumb id={e.id} size={104} style={{ borderRadius: 0 }} />
                    <View style={{ padding: spacing.sm }}>
                      <Text style={styles.simName} numberOfLines={2}>{e.name}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.attribution}>Görsel: © Gym visual — gymvisual.com</Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Antrenmana Ekle"
          variant="outline"
          icon={<Plus color={colors.text} size={18} />}
          onPress={() => router.push({ pathname: '/picker', params: { mode: 'addToRoutine', exerciseId: exercise.id } })}
          style={{ flex: 1 }}
        />
        <View style={{ width: spacing.md }} />
        <Button
          title="Hemen Başla"
          icon={<Play color={colors.onPrimary} size={18} fill={colors.onPrimary} />}
          onPress={() => router.push(`/session/single-${exercise.id}`)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.bgElevated },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(13,16,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtn: {
    position: 'absolute',
    right: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(13,16,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg },
  name: { fontFamily: fonts.display, fontSize: 30, color: colors.text, letterSpacing: 0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  muscleRow: { flexDirection: 'row', gap: spacing.lg },
  muscleItem: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  muscleIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim, textTransform: 'uppercase' },
  muscleValue: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'flex-start',
  },
  secondaryText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, flex: 1 },
  stepRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  stepBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.primary },
  stepText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 21 },
  moreBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  moreText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.primary },
  simCard: {
    width: 116,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  simName: { fontFamily: fonts.bodySb, fontSize: 12, color: colors.text, minHeight: 30 },
  attribution: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
