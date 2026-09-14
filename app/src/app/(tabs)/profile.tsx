import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, ChevronRight, Download, Globe, Heart, Info, Minus, Plus, RotateCcw, Timer } from 'lucide-react-native';
import { GENDERS, GOALS, LEVELS, LOCATIONS } from '../../data/labels';
import type { Gender, LocationPref } from '../../store/appStore';
import { checkForUpdate, currentVersion, downloadAndInstall, type UpdateInfo } from '../../lib/updates';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';
import { colors, fonts, radius, spacing } from '../../theme';
import { Card, Chip, SectionHeader, Title } from '../../components/ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lo } = useI18n();
  const store = useAppStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(store.name);
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [statDraft, setStatDraft] = useState('');

  const STAT_FIELDS = [
    { key: 'age', label: t('prof.age'), unit: '', value: store.age, min: 13, max: 90 },
    { key: 'heightCm', label: t('prof.height'), unit: 'cm', value: store.heightCm, min: 120, max: 220 },
    { key: 'weightKg', label: t('prof.weight'), unit: 'kg', value: store.weightKg, min: 35, max: 200 },
    { key: 'targetWeightKg', label: t('prof.target'), unit: 'kg', value: store.targetWeightKg, min: 35, max: 200 },
  ] as const;

  const saveStat = (key: string, min: number, max: number) => {
    const n = parseInt(statDraft, 10);
    if (!isNaN(n)) store.updateStats({ [key]: Math.min(max, Math.max(min, n)) });
    setEditingStat(null);
  };
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'current' | 'error' | 'downloading' | 'installing'>('idle');
  const [downloadPercent, setDownloadPercent] = useState(0);

  const startDownload = async (info: UpdateInfo) => {
    if (!info.url) return;
    setDownloadPercent(0);
    setUpdateState('downloading');
    const result = await downloadAndInstall(info.url, info.version ?? 'latest', setDownloadPercent);
    if (result.status === 'prompted') {
      setUpdateState('installing');
      setTimeout(() => setUpdateState('idle'), 8000);
      return;
    }
    setUpdateState('idle');
    Alert.alert(
      t('prof.downloadFailed'),
      result.error ?? t('prof.downloadFailedMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        ...(info.pageUrl ? [{ text: t('prof.openGithub'), onPress: () => Linking.openURL(info.pageUrl!) }] : []),
      ]
    );
  };

  const runUpdateCheck = async () => {
    if (updateState !== 'idle' && updateState !== 'error') return;
    setUpdateState('checking');
    const info = await checkForUpdate();
    if (info.status === 'available' && info.url) {
      setUpdateState('idle');
      Alert.alert(
        t('prof.newVersion', { n: info.version ?? '' }),
        info.notes ? info.notes.slice(0, 400) : t('prof.newVersionMsg'),
        [
          { text: t('prof.later'), style: 'cancel' },
          { text: t('prof.downloadInstall'), onPress: () => startDownload(info) },
        ]
      );
      return;
    }
    setUpdateState(info.status === 'available' ? 'idle' : info.status);
    setTimeout(() => setUpdateState('idle'), 4000);
  };

  const confirmReset = () =>
    Alert.alert(t('prof.resetTitle'), t('prof.resetMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('prof.reset'),
        style: 'destructive',
        onPress: () => {
          store.resetAll();
          router.replace('/onboarding');
        },
      },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      <Title>{t('prof.title')}</Title>

      {/* Identity */}
      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.idRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(store.name || 'S').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                onBlur={() => {
                  store.setName(nameDraft.trim());
                  setEditingName(false);
                }}
                onSubmitEditing={() => {
                  store.setName(nameDraft.trim());
                  setEditingName(false);
                }}
                autoFocus
                maxLength={20}
                returnKeyType="done"
              />
            ) : (
              <Pressable onPress={() => { setNameDraft(store.name); setEditingName(true); }}>
                <Text style={styles.name}>{store.name || t('prof.athlete')}</Text>
                <Text style={styles.nameHint}>{t('prof.tapToEdit')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Card>

      {/* Body stats */}
      <SectionHeader title={t('prof.bodyStats')} />
      <Card>
        <View style={styles.statGrid}>
          {STAT_FIELDS.map((f) =>
            editingStat === f.key ? (
              <View key={f.key} style={styles.statCell}>
                <TextInput
                  style={styles.statInput}
                  value={statDraft}
                  onChangeText={setStatDraft}
                  onBlur={() => saveStat(f.key, f.min, f.max)}
                  onSubmitEditing={() => saveStat(f.key, f.min, f.max)}
                  keyboardType="number-pad"
                  autoFocus
                  maxLength={3}
                  returnKeyType="done"
                />
                <Text style={styles.statLabel}>{f.label}</Text>
              </View>
            ) : (
              <Pressable
                key={f.key}
                style={styles.statCell}
                onPress={() => {
                  setStatDraft(f.value != null ? String(f.value) : '');
                  setEditingStat(f.key);
                }}
                accessibilityLabel={`${f.label} ${t('common.edit')}`}
              >
                <Text style={styles.statValue}>
                  {f.value ?? '—'}
                  {f.unit ? <Text style={styles.statUnit}> {f.unit}</Text> : null}
                </Text>
                <Text style={styles.statLabel}>{f.label}</Text>
              </Pressable>
            )
          )}
        </View>
        <Text style={styles.statHint}>{t('prof.tapValue')}</Text>
      </Card>

      {/* Training prefs */}
      <SectionHeader title={t('prof.workoutPrefs')} />
      <Card>
        <View style={styles.prefRow}>
          <View style={styles.prefIcon}>
            <Calendar color={colors.accent} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>{t('prof.weeklyFreq')}</Text>
            <Text style={styles.prefSub}>{t('prof.weeklyFreqSub')}</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => store.updateStats({ daysPerWeek: Math.max(1, (store.daysPerWeek ?? 3) - 1) })}
              accessibilityLabel={t('common.decrease')}
            >
              <Minus color={colors.text} size={16} />
            </Pressable>
            <Text style={styles.stepValue}>{store.daysPerWeek ?? '—'}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => store.updateStats({ daysPerWeek: Math.min(7, (store.daysPerWeek ?? 3) + 1) })}
              accessibilityLabel={t('common.increase')}
            >
              <Plus color={colors.text} size={16} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.prefCol, styles.prefBorder]}>
          <Text style={styles.prefTitle}>{t('prof.gender')}</Text>
          <View style={styles.chipWrap}>
            {GENDERS.map((g) => (
              <Chip
                key={g.id}
                label={lo(g)}
                active={store.gender === g.id}
                onPress={() => store.updateStats({ gender: g.id as Gender })}
              />
            ))}
          </View>
        </View>

        <View style={[styles.prefCol, styles.prefBorder]}>
          <Text style={styles.prefTitle}>{t('prof.location')}</Text>
          <View style={styles.chipWrap}>
            {LOCATIONS.map((l) => (
              <Chip
                key={l.id}
                label={lo(l)}
                active={store.preferredLocation === l.id}
                onPress={() => store.updateStats({ preferredLocation: l.id as LocationPref })}
              />
            ))}
          </View>
        </View>

        <View style={[styles.prefCol, styles.prefBorder]}>
          <Text style={styles.prefTitle}>{t('prof.goal')}</Text>
          <View style={styles.chipWrap}>
            {GOALS.map((g) => (
              <Chip key={g.id} label={lo(g)} active={store.goal === g.id} onPress={() => store.setGoal(g.id)} />
            ))}
          </View>
        </View>

        <View style={[styles.prefCol, styles.prefBorder]}>
          <Text style={styles.prefTitle}>{t('prof.level')}</Text>
          <View style={styles.chipWrap}>
            {LEVELS.map((l) => (
              <Chip key={l.id} label={lo(l)} active={store.level === l.id} onPress={() => store.setLevel(l.id)} />
            ))}
          </View>
        </View>
      </Card>

      {/* Preferences */}
      <SectionHeader title={t('prof.prefs')} />
      <Card>
        <View style={styles.prefRow}>
          <View style={styles.prefIcon}>
            <Timer color={colors.primary} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>{t('prof.defaultRest')}</Text>
            <Text style={styles.prefSub}>{t('prof.defaultRestSub')}</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => store.setRestSec(Math.max(10, store.restSec - 10))} accessibilityLabel={t('common.decrease')}>
              <Minus color={colors.text} size={16} />
            </Pressable>
            <Text style={styles.stepValue}>{store.restSec}{t('common.secAbbr')}</Text>
            <Pressable style={styles.stepBtn} onPress={() => store.setRestSec(Math.min(300, store.restSec + 10))} accessibilityLabel={t('common.increase')}>
              <Plus color={colors.text} size={16} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.prefRow, styles.prefBorder]}>
          <View style={styles.prefIcon}>
            <Globe color={colors.info} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>{t('prof.language')}</Text>
            <Text style={styles.prefSub}>{t('prof.languageSub')}</Text>
          </View>
          <View style={styles.langToggle}>
            <Pressable
              style={[styles.langBtn, store.instructionLang === 'tr' && styles.langBtnActive]}
              onPress={() => store.setInstructionLang('tr')}
            >
              <Text style={[styles.langText, store.instructionLang === 'tr' && styles.langTextActive]}>TR</Text>
            </Pressable>
            <Pressable
              style={[styles.langBtn, store.instructionLang === 'en' && styles.langBtnActive]}
              onPress={() => store.setInstructionLang('en')}
            >
              <Text style={[styles.langText, store.instructionLang === 'en' && styles.langTextActive]}>EN</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.prefRow, styles.prefBorder]}
          onPress={() => router.push('/(tabs)/exercises')}
        >
          <View style={styles.prefIcon}>
            <Heart color={colors.danger} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>{t('prof.myFavorites')}</Text>
            <Text style={styles.prefSub}>{t('common.exerciseCount', { n: store.favorites.length })}</Text>
          </View>
          <ChevronRight color={colors.textDim} size={18} />
        </Pressable>
      </Card>

      {/* Updates */}
      <SectionHeader title={t('prof.app')} />
      <Pressable
        style={styles.updateCard}
        onPress={runUpdateCheck}
        disabled={updateState === 'checking' || updateState === 'downloading' || updateState === 'installing'}
      >
        <View style={styles.prefIcon}>
          <Download color={colors.accent} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prefTitle}>{t('prof.checkUpdates')}</Text>
          <Text style={styles.prefSub}>
            {updateState === 'checking' && t('prof.checking')}
            {updateState === 'current' && t('prof.upToDate')}
            {updateState === 'error' && t('prof.connError')}
            {updateState === 'downloading' && t('prof.downloading', { n: downloadPercent })}
            {updateState === 'installing' && t('prof.installerOpened')}
            {updateState === 'idle' && t('prof.installedVer', { n: currentVersion() })}
          </Text>
          {updateState === 'downloading' && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(4, downloadPercent)}%` }]} />
            </View>
          )}
        </View>
        {updateState === 'checking' || updateState === 'downloading' || updateState === 'installing' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ChevronRight color={colors.textDim} size={18} />
        )}
      </Pressable>

      {/* Danger */}
      <SectionHeader title={t('prof.data')} />
      <Pressable style={styles.dangerCard} onPress={confirmReset}>
        <RotateCcw color={colors.danger} size={18} />
        <Text style={styles.dangerText}>{t('prof.resetAll')}</Text>
      </Pressable>

      {/* About */}
      <View style={styles.about}>
        <Info color={colors.textDim} size={14} />
        <Text style={styles.aboutText}>
          {t('prof.about', { v: currentVersion() })}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 30, color: colors.onPrimary },
  name: { fontFamily: fonts.displayMd, fontSize: 24, color: colors.text },
  nameHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim, marginTop: 2 },
  nameInput: {
    fontFamily: fonts.bodySb,
    fontSize: 20,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, marginTop: spacing.sm },
  statGrid: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center', gap: 2, minHeight: 44, justifyContent: 'center' },
  statValue: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  statUnit: { fontFamily: fonts.bodyMd, fontSize: 12, color: colors.textMuted },
  statLabel: {
    fontFamily: fonts.bodyMd,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statInput: {
    fontFamily: fonts.bodySb,
    fontSize: 20,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    minWidth: 44,
    textAlign: 'center',
    paddingVertical: 0,
  },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  prefCol: { paddingVertical: spacing.sm },
  prefBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  prefIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text },
  prefSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.text, minWidth: 44, textAlign: 'center' },
  langToggle: { flexDirection: 'row', gap: 6 },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontFamily: fonts.bodySb, fontSize: 13, color: colors.textMuted },
  langTextActive: { color: colors.onPrimary },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardAlt,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    padding: spacing.lg,
  },
  dangerText: { fontFamily: fonts.bodySb, fontSize: 15, color: colors.danger },
  about: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl, alignItems: 'flex-start' },
  aboutText: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim, flex: 1, lineHeight: 18 },
});
