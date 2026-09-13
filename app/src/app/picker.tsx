import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Heart, Plus, Search, X } from 'lucide-react-native';
import { EXERCISES, getExercise, searchExercises, type Exercise } from '../data/exercises';
import { BODY_PART_TR, EQUIPMENT_TR, tr } from '../data/labels';
import type { RoutineExercise } from '../data/programs';
import { uid, useAppStore } from '../store/appStore';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../theme';
import { ExerciseThumb } from '../components/ExerciseImage';
import { EmptyState } from '../components/ui';

export default function PickerScreen() {
  const params = useLocalSearchParams<{ mode?: string; exerciseId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customRoutines, saveCustomRoutine, setPendingPick, restSec, favorites } = useAppStore();
  const [query, setQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);

  const mode = params.mode ?? 'pick';
  const sourceExercise = params.exerciseId ? getExerciseSafe(params.exerciseId) : null;

  const results = useMemo(() => {
    let list = searchExercises(query, {});
    if (favOnly) list = list.filter((e) => favorites.includes(e.id));
    return list;
  }, [query, favOnly, favorites]);

  const onPickExercise = (e: Exercise) => {
    if (mode === 'pick') {
      setPendingPick(e.id);
      router.back();
    }
  };

  const addToRoutine = (routineId: string) => {
    if (!sourceExercise) return;
    const r = customRoutines.find((c) => c.id === routineId);
    if (!r) return;
    const item: RoutineExercise = { exerciseId: sourceExercise.id, sets: 3, reps: 12, restSec, timed: false };
    saveCustomRoutine({ ...r, exercises: [...r.exercises, item] });
    router.back();
  };

  const createRoutineWith = () => {
    if (!sourceExercise) return;
    saveCustomRoutine({
      id: `custom-${uid()}`,
      name: 'Yeni Program',
      description: 'Özel program',
      level: 'beginner',
      goals: ['general'],
      location: 'anywhere',
      exercises: [{ exerciseId: sourceExercise.id, sets: 3, reps: 12, restSec, timed: false }],
      custom: true,
    });
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {mode === 'addToRoutine' ? 'Programa Ekle' : 'Egzersiz Seç'}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityLabel="Kapat">
          <X color={colors.text} size={20} />
        </Pressable>
      </View>

      {mode === 'addToRoutine' && sourceExercise ? (
        <FlatList
          data={customRoutines}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={
            <Pressable style={styles.newRoutine} onPress={createRoutineWith}>
              <View style={styles.newIcon}>
                <Plus color={colors.primary} size={20} />
              </View>
              <Text style={styles.newText}>Yeni program oluştur</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <EmptyState
              title="Özel programın yok"
              subtitle="Önce bir program oluştur — seçtiğin egzersiz otomatik eklenecek."
            />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.routineRow} onPress={() => addToRoutine(item.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{item.name}</Text>
                <Text style={styles.routineMeta}>{item.exercises.length} egzersiz</Text>
              </View>
              <ChevronRight color={colors.textDim} size={18} />
            </Pressable>
          )}
        />
      ) : (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search color={colors.textDim} size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Egzersiz ara..."
                placeholderTextColor={colors.textDim}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoFocus
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} accessibilityLabel="Temizle">
                  <X color={colors.textDim} size={16} />
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.favToggle, favOnly && { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
              onPress={() => setFavOnly((v) => !v)}
              accessibilityLabel="Sadece favoriler"
            >
              <Heart color={favOnly ? colors.danger : colors.textMuted} size={18} fill={favOnly ? colors.danger : 'none'} />
            </Pressable>
          </View>
          {favOnly && favorites.length === 0 && (
            <Text style={styles.favHint}>Henüz favori egzersizin yok — egzersiz listesinde kalbe dokunarak ekleyebilirsin.</Text>
          )}
          <FlatList
            data={results}
            keyExtractor={(e) => e.id}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon={<Search color={colors.textDim} size={36} />}
                title="Sonuç bulunamadı"
                subtitle="Farklı bir isimle aramayı deneyin."
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => onPickExercise(item)}>
                <ExerciseThumb id={item.id} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.rowMeta}>
                    <View style={[styles.dot, { backgroundColor: BODY_PART_COLORS[item.bodyPart] ?? colors.primary }]} />
                    <Text style={styles.rowMetaText}>
                      {tr(BODY_PART_TR, item.bodyPart)} · {tr(EQUIPMENT_TR, item.equipment)}
                    </Text>
                  </View>
                </View>
                <Plus color={colors.primary} size={18} />
              </Pressable>
            )}
          />
        </>
      )}
    </View>
  );
}

function getExerciseSafe(id: string) {
  try {
    return getExercise(id);
  } catch {
    return undefined;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontFamily: fonts.displayMd, fontSize: 22, color: colors.text },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  favToggle: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim, marginBottom: spacing.md },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowName: { fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.text },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  rowMetaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  newRoutine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  newIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newText: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.primary },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  routineName: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  routineMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
