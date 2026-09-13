import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, Heart, RotateCcw, Search, Star, X } from 'lucide-react-native';
import {
  BODY_PARTS,
  EQUIPMENTS,
  searchExercises,
  TARGETS,
  type Exercise,
} from '../../data/exercises';
import { BODY_PART_TR, EQUIPMENT_TR, TARGET_TR, tr } from '../../data/labels';
import { useAppStore } from '../../store/appStore';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../../theme';
import { ExerciseThumb } from '../../components/ExerciseImage';
import { EmptyState } from '../../components/ui';

type FilterKey = 'bodyPart' | 'equipment' | 'target';

const FILTER_LABELS: Record<FilterKey, string> = {
  bodyPart: 'Bölge',
  equipment: 'Ekipman',
  target: 'Kas',
};

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ bodyPart?: string }>();
  const favorites = useAppStore((s) => s.favorites);

  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<string | null>(params.bodyPart ?? null);

  // Ana sayfadan kategori parametresiyle gelindiğinde filtreyi güncelle
  useEffect(() => {
    if (params.bodyPart) setBodyPart(params.bodyPart);
  }, [params.bodyPart]);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [modal, setModal] = useState<FilterKey | null>(null);

  const results = useMemo(() => {
    let list = searchExercises(query, { bodyPart, equipment, target });
    if (favOnly) list = list.filter((e) => favorites.includes(e.id));
    return list;
  }, [query, bodyPart, equipment, target, favOnly, favorites]);

  const activeCount = [bodyPart, equipment, target].filter(Boolean).length;

  const openModal = (k: FilterKey) => setModal(k);

  const modalOptions = useMemo(() => {
    if (modal === 'bodyPart') return BODY_PARTS.map((v) => ({ v, label: tr(BODY_PART_TR, v) }));
    if (modal === 'equipment') return EQUIPMENTS.map((v) => ({ v, label: tr(EQUIPMENT_TR, v) }));
    if (modal === 'target') return TARGETS.map((v) => ({ v, label: tr(TARGET_TR, v) }));
    return [];
  }, [modal]);

  const currentValue = modal === 'bodyPart' ? bodyPart : modal === 'equipment' ? equipment : target;
  const setValue = (v: string | null) => {
    if (modal === 'bodyPart') setBodyPart(v);
    else if (modal === 'equipment') setEquipment(v);
    else if (modal === 'target') setTarget(v);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      {/* Search */}
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
            returnKeyType="search"
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ paddingRight: spacing.lg }}
      >
        <FilterChip
          label="Bölge"
          value={bodyPart ? tr(BODY_PART_TR, bodyPart) : 'Tümü'}
          active={!!bodyPart}
          onPress={() => openModal('bodyPart')}
        />
        <FilterChip
          label="Ekipman"
          value={equipment ? tr(EQUIPMENT_TR, equipment) : 'Tümü'}
          active={!!equipment}
          onPress={() => openModal('equipment')}
        />
        <FilterChip
          label="Kas"
          value={target ? tr(TARGET_TR, target) : 'Tümü'}
          active={!!target}
          onPress={() => openModal('target')}
        />
        {activeCount > 0 && (
          <Pressable
            style={styles.resetChip}
            onPress={() => {
              setBodyPart(null);
              setEquipment(null);
              setTarget(null);
            }}
            accessibilityLabel="Filtreleri sıfırla"
          >
            <RotateCcw color={colors.danger} size={14} />
            <Text style={styles.resetChipText}>Sıfırla</Text>
          </Pressable>
        )}
      </ScrollView>

      <Text style={styles.countText}>{results.length} egzersiz</Text>

      <FlatList
        data={results}
        keyExtractor={(e) => e.id}
        initialNumToRender={14}
        maxToRenderPerBatch={14}
        windowSize={9}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Search color={colors.textDim} size={40} />}
            title="Sonuç bulunamadı"
            subtitle="Filtreleri değiştirmeyi veya farklı bir arama yapmayı deneyin."
          />
        }
        renderItem={({ item }) => <ExerciseRow item={item} onPress={() => router.push(`/exercise/${item.id}`)} />}
      />

      {/* Filter modal */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModal(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modal ? FILTER_LABELS[modal] : ''} Seç</Text>
            <Pressable onPress={() => setModal(null)} accessibilityLabel="Kapat">
              <X color={colors.textMuted} size={22} />
            </Pressable>
          </View>
          <FlatList
            data={[{ v: null, label: 'Tümü' }, ...modalOptions]}
            keyExtractor={(o) => o.v ?? 'all'}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalOption}
                onPress={() => {
                  setValue(item.v);
                  setModal(null);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    currentValue === item.v && { color: colors.primary, fontFamily: fonts.bodySb },
                  ]}
                >
                  {item.label}
                </Text>
                {currentValue === item.v && <Star color={colors.primary} size={16} fill={colors.primary} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

function FilterChip({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.filterChipLabel, active && { color: 'rgba(17,19,24,0.65)' }]}>{label}</Text>
      <Text
        style={[styles.filterChipValue, active && { color: colors.onPrimary }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <ChevronDown color={active ? colors.onPrimary : colors.textDim} size={14} />
    </Pressable>
  );
}

function ExerciseRow({ item, onPress }: { item: Exercise; onPress: () => void }) {
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFav = useAppStore((s) => s.favorites.includes(item.id));
  const dotColor = BODY_PART_COLORS[item.bodyPart] ?? colors.primary;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <ExerciseThumb id={item.id} size={64} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.rowMetaText} numberOfLines={1}>
            {tr(BODY_PART_TR, item.bodyPart)} · {tr(EQUIPMENT_TR, item.equipment)}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => toggleFavorite(item.id)}
        hitSlop={10}
        accessibilityLabel="Favori"
        style={{ padding: 4 }}
      >
        <Heart color={isFav ? colors.danger : colors.textDim} size={18} fill={isFav ? colors.danger : 'none'} />
      </Pressable>
      <ChevronRight color={colors.textDim} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
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
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 15 },
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
  chipRow: { marginTop: spacing.md, height: 44 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    alignSelf: 'center',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim },
  filterChipValue: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.text, maxWidth: 120 },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 40,
    alignSelf: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    marginRight: spacing.sm,
  },
  resetChipText: { fontFamily: fonts.bodySb, fontSize: 12, color: colors.danger },
  countText: {
    fontFamily: fonts.bodyMd,
    fontSize: 12,
    color: colors.textDim,
    marginVertical: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  rowBody: { flex: 1 },
  rowName: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  rowMetaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontFamily: fonts.displayMd, fontSize: 20, color: colors.text },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalOptionText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
});
