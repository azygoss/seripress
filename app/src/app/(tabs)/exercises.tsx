import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
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
import { BODY_PART_TR, EQUIPMENT_TR, TARGET_TR } from '../../data/labels';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';
import type { StrKey } from '../../i18n/strings';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../../theme';
import { ExerciseThumb } from '../../components/ExerciseImage';
import { EmptyState } from '../../components/ui';

type FilterKey = 'bodyPart' | 'equipment' | 'target';

const FILTER_KEYS: Record<FilterKey, StrKey> = {
  bodyPart: 'ex.filterBodyPart',
  equipment: 'ex.filterEquipment',
  target: 'ex.filterTarget',
};

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lb, exName } = useI18n();
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
    if (modal === 'bodyPart') return BODY_PARTS.map((v) => ({ v, label: lb(BODY_PART_TR, v) }));
    if (modal === 'equipment') return EQUIPMENTS.map((v) => ({ v, label: lb(EQUIPMENT_TR, v) }));
    if (modal === 'target') return TARGETS.map((v) => ({ v, label: lb(TARGET_TR, v) }));
    return [];
  }, [modal, lb]);

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
            placeholder={t('ex.searchPlaceholder')}
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t('common.clear')}>
              <X color={colors.textDim} size={16} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.favToggle, favOnly && { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
          onPress={() => setFavOnly((v) => !v)}
          accessibilityLabel={t('common.onlyFavorites')}
        >
          <Heart color={favOnly ? colors.danger : colors.textMuted} size={18} fill={favOnly ? colors.danger : 'none'} />
        </Pressable>
      </View>

      {/* Filter chips — üç filtre ekran genişliğine eşit bölünür */}
      <View style={styles.filterRow}>
        <FilterChip
          label={t('ex.filterBodyPart')}
          value={bodyPart ? lb(BODY_PART_TR, bodyPart) : t('common.all')}
          active={!!bodyPart}
          onPress={() => openModal('bodyPart')}
        />
        <FilterChip
          label={t('ex.filterEquipment')}
          value={equipment ? lb(EQUIPMENT_TR, equipment) : t('common.all')}
          active={!!equipment}
          onPress={() => openModal('equipment')}
        />
        <FilterChip
          label={t('ex.filterTarget')}
          value={target ? lb(TARGET_TR, target) : t('common.all')}
          active={!!target}
          onPress={() => openModal('target')}
        />
        {activeCount > 0 && (
          <Pressable
            style={styles.resetBtn}
            onPress={() => {
              setBodyPart(null);
              setEquipment(null);
              setTarget(null);
            }}
            accessibilityLabel={t('ex.resetFilters')}
          >
            <RotateCcw color={colors.danger} size={16} />
          </Pressable>
        )}
      </View>

      <Text style={styles.countText}>{t('common.exerciseCount', { n: results.length })}</Text>

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
            title={t('common.noResults')}
            subtitle={t('ex.emptySub')}
          />
        }
        renderItem={({ item }) => <ExerciseRow item={item} onPress={() => router.push(`/exercise/${item.id}`)} />}
      />

      {/* Filter modal */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModal(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modal ? t('ex.selectLabel', { label: t(FILTER_KEYS[modal]) }) : ''}
            </Text>
            <Pressable onPress={() => setModal(null)} accessibilityLabel={t('common.close')}>
              <X color={colors.textMuted} size={22} />
            </Pressable>
          </View>
          <FlatList
            data={[{ v: null, label: t('common.all') }, ...modalOptions]}
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
      <View style={styles.filterChipValueRow}>
        <Text
          style={[styles.filterChipValue, active && { color: colors.onPrimary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <ChevronDown color={active ? colors.onPrimary : colors.textDim} size={14} />
      </View>
    </Pressable>
  );
}

function ExerciseRow({ item, onPress }: { item: Exercise; onPress: () => void }) {
  const { t, lb, exName } = useI18n();
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFav = useAppStore((s) => s.favorites.includes(item.id));
  const dotColor = BODY_PART_COLORS[item.bodyPart] ?? colors.primary;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <ExerciseThumb id={item.id} size={64} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {exName(item)}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.rowMetaText} numberOfLines={1}>
            {lb(BODY_PART_TR, item.bodyPart)} · {lb(EQUIPMENT_TR, item.equipment)}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => toggleFavorite(item.id)}
        hitSlop={10}
        accessibilityLabel={t('common.favorite')}
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'stretch',
  },
  filterChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.4 },
  filterChipValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  filterChipValue: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text, flex: 1 },
  resetBtn: {
    width: 52,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
