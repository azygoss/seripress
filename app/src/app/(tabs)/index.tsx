import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Flame, Play, Star, Timer, Trophy } from 'lucide-react-native';
import { BODY_PARTS, countByBodyPart, EXERCISES } from '../../data/exercises';
import { BODY_PART_TR, tr, LEVELS, GOALS } from '../../data/labels';
import { PRESET_ROUTINES, recommendedRoutineId, routineMinutes } from '../../data/programs';
import { streakDays, totalMinutes, totalWorkouts, useAppStore, weekActivity } from '../../store/appStore';
import { colors, fonts, radius, spacing, BODY_PART_COLORS } from '../../theme';
import { ExerciseThumb } from '../../components/ExerciseImage';
import { SectionHeader, StatTile } from '../../components/ui';

const CATEGORY_ICONS: Record<string, string> = {
  chest: 'Göğüs',
  back: 'Sırt',
  shoulders: 'Omuz',
  'upper arms': 'Üst Kol',
  'lower legs': 'Alt Bacak',
  'lower arms': 'Ön Kol',
  waist: 'Karın',
  'upper legs': 'Üst Bacak',
  cardio: 'Kardiyo',
  neck: 'Boyun',
};

const CATEGORY_COVER: Record<string, string> = {
  chest: '0025', // barbell bench press
  back: '0652', // pull-up
  shoulders: '0405', // dumbbell seated shoulder press
  'upper arms': '0294', // dumbbell biceps curl
  'lower arms': '1412', // wrist curl
  'lower legs': '1373', // standing calf raise
  waist: '0274', // crunch
  'upper legs': '0043', // barbell full squat
  cardio: '1160', // burpee
  neck: '1403', // neck side stretch
};

const POPULAR_IDS = ['0662', '0025', '0043', '0032', '0652', '0294', '0630', '1160'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { onboarded, name, goal, level, sessions, favorites, preferredLocation } = useAppStore();

  const recommended = useMemo(() => {
    const id = recommendedRoutineId(goal, level, preferredLocation);
    return PRESET_ROUTINES.find((r) => r.id === id) ?? PRESET_ROUTINES[0];
  }, [goal, level, preferredLocation]);

  const week = useMemo(() => weekActivity(sessions), [sessions]);
  const popular = useMemo(
    () => POPULAR_IDS.map((id) => EXERCISES.find((e) => e.id === id)).filter(Boolean),
    []
  );
  const goalLabel = GOALS.find((g) => g.id === goal)?.label ?? 'Genel Fitness';

  if (!onboarded) return <Redirect href="/onboarding" />;

  const maxMin = Math.max(...week.map((d) => d.minutes), 1);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting()}, {name || 'Sporcu'}
          </Text>
          <Text style={styles.goalText}>
            {goalLabel} · {LEVELS.find((l) => l.id === level)?.label}
          </Text>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push('/profile')}
          accessibilityLabel="Profil"
        >
          <Text style={styles.avatarText}>{(name || 'S').slice(0, 1).toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatTile
          value={streakDays(sessions)}
          label="Seri"
          color={colors.primary}
          icon={<Flame color={colors.primary} size={18} />}
        />
        <View style={{ width: spacing.md }} />
        <StatTile
          value={totalWorkouts(sessions)}
          label="Antrenman"
          icon={<Trophy color={colors.accent} size={18} />}
        />
        <View style={{ width: spacing.md }} />
        <StatTile
          value={totalMinutes(sessions)}
          label="Dakika"
          icon={<Timer color={colors.info} size={18} />}
        />
      </View>

      {/* Recommended workout */}
      <SectionHeader title="Bugünkü Antrenman" />
      <Pressable onPress={() => router.push(`/routine/${recommended.id}`)}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>ÖNERİLEN</Text>
            </View>
            <Text style={styles.heroTitle}>{recommended.name}</Text>
            <Text style={styles.heroSub}>
              {recommended.exercises.length} egzersiz · ~{routineMinutes(recommended)} dk
            </Text>
            <View style={styles.heroCta}>
              <Play color={colors.onPrimary} size={16} fill={colors.onPrimary} />
              <Text style={styles.heroCtaText}>Başla</Text>
            </View>
          </View>
          <ExerciseThumb
            id={recommended.exercises[0]?.exerciseId ?? '0001'}
            size={92}
            style={{ borderRadius: radius.lg }}
          />
        </LinearGradient>
      </Pressable>

      {/* Weekly activity */}
      <SectionHeader title="Bu Hafta" />
      <View style={styles.weekCard}>
        {week.map((d) => (
          <View key={d.label} style={styles.weekCol}>
            <View style={styles.weekBarWrap}>
              <View
                style={[
                  styles.weekBar,
                  {
                    height: Math.max(4, (d.minutes / maxMin) * 64),
                    backgroundColor: d.isToday ? colors.primary : d.minutes > 0 ? colors.accent : colors.border,
                  },
                ]}
              />
            </View>
            <Text style={[styles.weekLabel, d.isToday && { color: colors.primary }]}>{d.label}</Text>
          </View>
        ))}
      </View>

      {/* Categories */}
      <SectionHeader title="Kas Grupları" />
      <View style={styles.catGrid}>
        {BODY_PARTS.map((part) => (
          <Pressable
            key={part}
            style={({ pressed }) => [styles.catItem, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/(tabs)/exercises', params: { bodyPart: part } })}
          >
            <View style={styles.catThumbWrap}>
              <ExerciseThumb id={CATEGORY_COVER[part] ?? '0001'} size={54} style={{ borderRadius: radius.md }} />
              <View
                style={[styles.catDotSm, { backgroundColor: BODY_PART_COLORS[part] ?? colors.primary }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.catName} numberOfLines={1}>
                {CATEGORY_ICONS[part] ?? tr(BODY_PART_TR, part)}
              </Text>
              <Text style={styles.catCount}>{countByBodyPart(part)} hareket</Text>
            </View>
            <ChevronRight color={colors.textDim} size={16} />
          </Pressable>
        ))}
      </View>

      {/* Popular */}
      <SectionHeader
        title="Popüler Egzersizler"
        right={
          <Pressable onPress={() => router.push('/(tabs)/exercises')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>Tümü</Text>
            <ChevronRight color={colors.primary} size={16} />
          </Pressable>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {popular.map((e) =>
          e ? (
            <Pressable
              key={e.id}
              style={styles.popCard}
              onPress={() => router.push(`/exercise/${e.id}`)}
            >
              <ExerciseThumb id={e.id} size={120} style={{ borderRadius: 0 }} />
              <View style={{ padding: spacing.sm }}>
                <Text style={styles.popName} numberOfLines={2}>
                  {e.name}
                </Text>
                <Text style={styles.popMeta}>{tr(BODY_PART_TR, e.bodyPart)}</Text>
              </View>
            </Pressable>
          ) : null
        )}
      </ScrollView>

      {/* Favorites shortcut */}
      {favorites.length > 0 && (
        <>
          <SectionHeader title="Favoriler" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            {favorites.slice(0, 10).map((id) => {
              const e = EXERCISES.find((x) => x.id === id);
              if (!e) return null;
              return (
                <Pressable
                  key={id}
                  style={styles.favCard}
                  onPress={() => router.push(`/exercise/${id}`)}
                >
                  <ExerciseThumb id={id} size={56} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.favName} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={styles.popMeta}>{tr(BODY_PART_TR, e.bodyPart)}</Text>
                  </View>
                  <Star color={colors.warning} size={14} fill={colors.warning} />
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  greeting: { fontFamily: fonts.display, fontSize: 30, color: colors.text, letterSpacing: 0.4 },
  goalText: { fontFamily: fonts.bodyMd, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 22, color: colors.onPrimary },
  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  heroBadgeText: { fontFamily: fonts.bodySb, fontSize: 10, color: colors.white, letterSpacing: 1 },
  heroTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.white },
  heroSub: { fontFamily: fonts.bodyMd, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  heroCtaText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.white },
  weekCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  weekCol: { alignItems: 'center', flex: 1 },
  weekBarWrap: { height: 68, justifyContent: 'flex-end' },
  weekBar: { width: 18, borderRadius: 6 },
  weekLabel: { fontFamily: fonts.bodyMd, fontSize: 11, color: colors.textMuted, marginTop: 6 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  catItem: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catThumbWrap: { position: 'relative' },
  catDotSm: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.card,
  },
  catName: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  catCount: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.primary },
  popCard: {
    width: 132,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  popName: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.text, minHeight: 34 },
  popMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: 230,
  },
  favName: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.text },
});
