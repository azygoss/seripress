import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Clock, Dumbbell, Home, Layers, MapPin, Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { getExercise } from '../../data/exercises';
import { LEVELS } from '../../data/labels';
import { PRESET_ROUTINES, routineMinutes, routineName, routineSetCount, type Routine } from '../../data/programs';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';
import { colors, fonts, radius, spacing } from '../../theme';
import { ExerciseThumb } from '../../components/ExerciseImage';
import { Button, EmptyState, SectionHeader, Title } from '../../components/ui';

const LOCATION_LABEL: Record<string, string> = {
  home: 'Ev',
  gym: 'Salon',
  anywhere: 'Her Yerde',
};
const LOCATION_LABEL_EN: Record<string, string> = {
  home: 'Home',
  gym: 'Gym',
  anywhere: 'Anywhere',
};

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t } = useI18n();
  const { customRoutines, deleteCustomRoutine } = useAppStore();

  const confirmDelete = (r: Routine) =>
    Alert.alert(t('prog.deleteTitle'), t('prog.deleteMsg', { name: routineName(r, lang) }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCustomRoutine(r.id) },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      <Title>{t('prog.title')}</Title>

      <View style={styles.myHeader}>
        <SectionHeader title={t('prog.yours')} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            title={t('prog.generate')}
            variant="ghost"
            icon={<Sparkles color={colors.primary} size={16} />}
            onPress={() => router.push('/generate')}
            style={{ minHeight: 40, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
          />
          <Button
            title={t('prog.create')}
            variant="ghost"
            icon={<Plus color={colors.text} size={16} />}
            onPress={() => router.push('/builder')}
            style={{ minHeight: 40, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
          />
        </View>
      </View>

      {customRoutines.length === 0 ? (
        <Pressable style={styles.createCard} onPress={() => router.push('/builder')}>
          <View style={styles.createIcon}>
            <Sparkles color={colors.primary} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>{t('prog.createTitle')}</Text>
            <Text style={styles.createSub}>{t('prog.createSub')}</Text>
          </View>
          <ChevronRight color={colors.textDim} size={20} />
        </Pressable>
      ) : (
        customRoutines.map((r) => (
          <RoutineCard
            key={r.id}
            routine={r}
            onPress={() => router.push(`/routine/${r.id}`)}
            onDelete={() => confirmDelete(r)}
            custom
          />
        ))
      )}

      {(['home', 'gym', 'anywhere'] as const).map((loc) => {
        const list = PRESET_ROUTINES.filter((r) => r.location === loc);
        if (!list.length) return null;
        return (
          <View key={loc}>
            <SectionHeader
              title={t('prog.presets', { loc: (lang === 'en' ? LOCATION_LABEL_EN : LOCATION_LABEL)[loc] })}
            />
            {list.map((r) => (
              <RoutineCard key={r.id} routine={r} onPress={() => router.push(`/routine/${r.id}`)} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function RoutineCard({
  routine,
  onPress,
  onDelete,
  custom,
}: {
  routine: Routine;
  onPress: () => void;
  onDelete?: () => void;
  custom?: boolean;
}) {
  const { lang, t, lo } = useI18n();
  const coverId = routine.exercises[0]?.exerciseId ?? '0001';
  const cover = getExercise(coverId);
  const mins = routineMinutes(routine);
  const sets = routineSetCount(routine);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <ExerciseThumb id={cover?.id ?? '0001'} size={72} />
      <View style={styles.cardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.cardName} numberOfLines={1}>{routineName(routine, lang)}</Text>
          {custom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>{t('prog.custom')}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Dumbbell color={colors.textDim} size={12} />
            <Text style={styles.metaText}>{t('common.exerciseCount', { n: routine.exercises.length })}</Text>
          </View>
          <View style={styles.metaItem}>
            <Layers color={colors.textDim} size={12} />
            <Text style={styles.metaText}>{t('common.setCount', { n: sets })}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock color={colors.textDim} size={12} />
            <Text style={styles.metaText}>~{mins} {t('common.minAbbr')}</Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin color={colors.textDim} size={12} />
            <Text style={styles.metaText}>
              {(lang === 'en' ? LOCATION_LABEL_EN : LOCATION_LABEL)[routine.location] ?? ''}
            </Text>
          </View>
        </View>
        <Text style={styles.cardLevel}>{lo(LEVELS.find((l) => l.id === routine.level))}</Text>
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel={t('common.delete')} style={{ padding: 4 }}>
          <Trash2 color={colors.danger} size={18} />
        </Pressable>
      ) : (
        <ChevronRight color={colors.textDim} size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  myHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  createSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardBody: { flex: 1 },
  cardName: { fontFamily: fonts.bodySb, fontSize: 16, color: colors.text, flexShrink: 1 },
  customBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  customBadgeText: { fontFamily: fonts.bodySb, fontSize: 9, color: colors.accent, letterSpacing: 1 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  cardLevel: { fontFamily: fonts.bodyMd, fontSize: 11, color: colors.primary, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
});
