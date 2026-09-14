import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, ChevronRight, Flame, Play, Sparkles, Star, Timer, Trophy } from 'lucide-react-native';
import { BODY_PARTS, countByBodyPart, EXERCISES } from '../../data/exercises';
import { BODY_PART_TR, LEVELS, GOALS } from '../../data/labels';
import { PRESET_ROUTINES, recommendedRoutineId, routineMinutes, routineName } from '../../data/programs';
import { streakDays, totalMinutes, totalWorkouts, useAppStore, weekActivity } from '../../store/appStore';
import { useI18n } from '../../i18n';
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
  const { lang, t, lb, lo, exName } = useI18n();
  const { onboarded, name, goal, level, sessions, favorites, preferredLocation } = useAppStore();

  const recommended = useMemo(() => {
    const id = recommendedRoutineId(goal, level, preferredLocation);
    return PRESET_ROUTINES.find((r) => r.id === id) ?? PRESET_ROUTINES[0];
  }, [goal, level, preferredLocation]);

  const week = useMemo(() => weekActivity(sessions, lang), [sessions, lang]);
  const popular = useMemo(
    () => POPULAR_IDS.map((id) => EXERCISES.find((e) => e.id === id)).filter(Boolean),
    []
  );
  const goalLabel = lo(GOALS.find((g) => g.id === goal));

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
            {greeting(lang)}, {name || t('home.athlete')}
          </Text>
          <Text style={styles.goalText}>
            {goalLabel} · {lo(LEVELS.find((l) => l.id === level))}
          </Text>
        </View>
        <Pressable
          style={styles.statsBtn}
          onPress={() => router.push('/stats')}
          accessibilityLabel={t('stats.title')}
        >
          <BarChart3 color={colors.text} size={20} />
        </Pressable>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push('/profile')}
          accessibilityLabel={t('tab.profile')}
        >
          <Text style={styles.avatarText}>{(name || 'S').slice(0, 1).toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatTile
          value={streakDays(sessions)}
          label={t('home.streak')}
          color={colors.primary}
          icon={<Flame color={colors.primary} size={18} />}
        />
        <View style={{ width: spacing.md }} />
        <StatTile
          value={totalWorkouts(sessions)}
          label={t('home.workouts')}
          icon={<Trophy color={colors.accent} size={18} />}
        />
        <View style={{ width: spacing.md }} />
        <StatTile
          value={totalMinutes(sessions)}
          label={t('home.minutes')}
          icon={<Timer color={colors.info} size={18} />}
        />
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={() => router.push('/generate')}>
          <Sparkles color={colors.primary} size={18} />
          <Text style={styles.quickText}>{t('gen.title')}</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push('/timer')}>
          <Timer color={colors.accent} size={18} />
          <Text style={styles.quickText}>{t('timer.title')}</Text>
        </Pressable>
      </View>

      {/* Recommended workout */}
      <SectionHeader title={t('home.todaysWorkout')} />
      <Pressable onPress={() => router.push(`/routine/${recommended.id}`)}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{t('home.recommended')}</Text>
            </View>
            <Text style={styles.heroTitle}>{routineName(recommended, lang)}</Text>
            <Text style={styles.heroSub}>
              {t('common.exerciseCount', { n: recommended.exercises.length })} · ~{routineMinutes(recommended)} {t('common.minAbbr')}
            </Text>
            <View style={styles.heroCta}>
              <Play color={colors.onPrimary} size={16} fill={colors.onPrimary} />
              <Text style={styles.heroCtaText}>{t('common.start')}</Text>
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
      <SectionHeader title={t('home.thisWeek')} />
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
      <SectionHeader title={t('home.muscleGroups')} />
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
                {lang === 'en' ? lb(BODY_PART_TR, part) : CATEGORY_ICONS[part] ?? lb(BODY_PART_TR, part)}
              </Text>
              <Text style={styles.catCount}>{t('common.moveCount', { n: countByBodyPart(part) })}</Text>
            </View>
            <ChevronRight color={colors.textDim} size={16} />
          </Pressable>
        ))}
      </View>

      {/* Popular */}
      <SectionHeader
        title={t('home.popular')}
        right={
          <Pressable onPress={() => router.push('/(tabs)/exercises')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
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
                  {exName(e)}
                </Text>
                <Text style={styles.popMeta}>{lb(BODY_PART_TR, e.bodyPart)}</Text>
              </View>
            </Pressable>
          ) : null
        )}
      </ScrollView>

      {/* Favorites shortcut */}
      {favorites.length > 0 && (
        <>
          <SectionHeader title={t('home.favorites')} />
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
                      {exName(e)}
                    </Text>
                    <Text style={styles.popMeta}>{lb(BODY_PART_TR, e.bodyPart)}</Text>
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

function greeting(lang: 'tr' | 'en'): string {
  const h = new Date().getHours();
  if (lang === 'en') {
    if (h < 6) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
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
  statsBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  quickText: { fontFamily: fonts.bodySb, fontSize: 14, color: colors.text },
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
