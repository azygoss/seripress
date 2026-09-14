import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { STR, type StrKey } from './strings';

export type Lang = 'tr' | 'en';

/** Dataset değerleri için İngilizce etiket — anahtar zaten İngilizce, sadece biçimlenir. */
const EN_OVERRIDES: Record<string, string> = {
  'ez barbell': 'EZ Bar',
  'bosu ball': 'Bosu Ball',
  'skierg machine': 'SkiErg',
  'body weight': 'Bodyweight',
  'cardiovascular system': 'Cardio',
  'upper body ergometer': 'Upper Body Ergometer',
};

const titleCaseEn = (s: string) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

export function enLabel(key: string): string {
  return EN_OVERRIDES[key] ?? titleCaseEn(key);
}

export function useI18n() {
  const lang = useAppStore((s) => s.instructionLang);

  const t = useCallback(
    (key: StrKey, vars?: Record<string, string | number>) => {
      let s: string = STR[lang][key] ?? STR.tr[key] ?? key;
      if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
      return s;
    },
    [lang]
  );

  /** TR etiket haritası + İngilizce'de dataset anahtarını biçimle */
  const lb = useCallback(
    (map: Record<string, string>, key: string) =>
      lang === 'tr' ? (map[key] ?? key) : enLabel(key),
    [lang]
  );

  /** label/labelEn taşıyan seçenek nesnesinden dile göre etiket */
  const lo = useCallback(
    <T extends { label: string; labelEn?: string }>(o: T | undefined) =>
      !o ? '' : lang === 'en' && o.labelEn ? o.labelEn : o.label,
    [lang]
  );

  /** Egzersiz ismi — EN'de (Erkek)→(Male) gibi ekler İngilizce kalır */
  const exName = useCallback(
    (e: { name: string; nameEn?: string }) => (lang === 'en' && e.nameEn ? e.nameEn : e.name),
    [lang]
  );

  return { lang, t, lb, lo, exName };
}
