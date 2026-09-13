import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Download, Globe, Heart, Info, Minus, Plus, RotateCcw, Timer } from 'lucide-react-native';
import { GOALS, LEVELS, type GoalId, type LevelId } from '../../data/labels';
import { checkForUpdate, currentVersion, downloadAndInstall, type UpdateInfo } from '../../lib/updates';
import { useAppStore } from '../../store/appStore';
import { colors, fonts, radius, spacing } from '../../theme';
import { Card, Chip, SectionHeader, Title } from '../../components/ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useAppStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(store.name);
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
      'İndirilemedi',
      result.error ?? 'Güncelleme indirilemedi.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        ...(info.pageUrl ? [{ text: "GitHub'da Aç", onPress: () => Linking.openURL(info.pageUrl!) }] : []),
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
        `Yeni sürüm: v${info.version}`,
        info.notes ? info.notes.slice(0, 400) : 'Yeni bir sürüm yayınlandı.',
        [
          { text: 'Daha Sonra', style: 'cancel' },
          { text: 'İndir ve Kur', onPress: () => startDownload(info) },
        ]
      );
      return;
    }
    setUpdateState(info.status === 'available' ? 'idle' : info.status);
    setTimeout(() => setUpdateState('idle'), 4000);
  };

  const confirmReset = () =>
    Alert.alert('Tüm Verileri Sıfırla', 'Antrenman geçmişi, favoriler ve özel programlar silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
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
      <Title>Profil</Title>

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
                <Text style={styles.name}>{store.name || 'Sporcu'}</Text>
                <Text style={styles.nameHint}>Düzenlemek için dokun</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Card>

      {/* Goal */}
      <SectionHeader title="Hedef" />
      <View style={styles.chipWrap}>
        {GOALS.map((g) => (
          <Chip key={g.id} label={g.label} active={store.goal === g.id} onPress={() => store.setGoal(g.id)} />
        ))}
      </View>

      {/* Level */}
      <SectionHeader title="Seviye" />
      <View style={styles.chipWrap}>
        {LEVELS.map((l) => (
          <Chip key={l.id} label={l.label} active={store.level === l.id} onPress={() => store.setLevel(l.id)} />
        ))}
      </View>

      {/* Preferences */}
      <SectionHeader title="Tercihler" />
      <Card>
        <View style={styles.prefRow}>
          <View style={styles.prefIcon}>
            <Timer color={colors.primary} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Varsayılan dinlenme</Text>
            <Text style={styles.prefSub}>Yeni programlarda set arası süre</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => store.setRestSec(Math.max(10, store.restSec - 10))} accessibilityLabel="Azalt">
              <Minus color={colors.text} size={16} />
            </Pressable>
            <Text style={styles.stepValue}>{store.restSec}sn</Text>
            <Pressable style={styles.stepBtn} onPress={() => store.setRestSec(Math.min(300, store.restSec + 10))} accessibilityLabel="Arttır">
              <Plus color={colors.text} size={16} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.prefRow, styles.prefBorder]}>
          <View style={styles.prefIcon}>
            <Globe color={colors.info} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Talimat dili</Text>
            <Text style={styles.prefSub}>Egzersiz adım adım anlatımı</Text>
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
            <Text style={styles.prefTitle}>Favorilerim</Text>
            <Text style={styles.prefSub}>{store.favorites.length} egzersiz</Text>
          </View>
          <ChevronRight color={colors.textDim} size={18} />
        </Pressable>
      </Card>

      {/* Updates */}
      <SectionHeader title="Uygulama" />
      <Pressable
        style={styles.updateCard}
        onPress={runUpdateCheck}
        disabled={updateState === 'checking' || updateState === 'downloading' || updateState === 'installing'}
      >
        <View style={styles.prefIcon}>
          <Download color={colors.accent} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prefTitle}>Güncellemeleri kontrol et</Text>
          <Text style={styles.prefSub}>
            {updateState === 'checking' && 'Kontrol ediliyor…'}
            {updateState === 'current' && 'Güncelsin — en son sürümü kullanıyorsun.'}
            {updateState === 'error' && 'Bağlantı hatası. İnternetini kontrol et.'}
            {updateState === 'downloading' && `Güncelleme indiriliyor… %${downloadPercent}`}
            {updateState === 'installing' && 'Kurulum ekranı açıldı — onaylaman gerekiyor.'}
            {updateState === 'idle' && `Kurulu sürüm: v${currentVersion()}`}
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
      <SectionHeader title="Veri" />
      <Pressable style={styles.dangerCard} onPress={confirmReset}>
        <RotateCcw color={colors.danger} size={18} />
        <Text style={styles.dangerText}>Tüm verileri sıfırla</Text>
      </Pressable>

      {/* About */}
      <View style={styles.about}>
        <Info color={colors.textDim} size={14} />
        <Text style={styles.aboutText}>
          SporApp v{currentVersion()} · 1.324 egzersiz verisi: exercises-dataset · Görseller © Gym visual
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
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
