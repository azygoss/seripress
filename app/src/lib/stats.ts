import { getExercise } from '../data/exercises';
import type { SessionLog } from '../store/appStore';

const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Bu hafta bölge başına tamamlanan set sayısı */
export function weeklyVolume(sessions: SessionLog[]): Map<string, number> {
  const since = Date.now() - WEEK_MS;
  const out = new Map<string, number>();
  for (const s of sessions) {
    if (s.endedAt < since) continue;
    for (const ex of s.exercises) {
      const e = getExercise(ex.exerciseId);
      if (!e) continue;
      out.set(e.bodyPart, (out.get(e.bodyPart) ?? 0) + ex.setsCompleted);
    }
  }
  return out;
}

/** Seviyeye göre haftalık hedef set aralığı (bölge başına) */
export function weeklyTarget(level: string | undefined): { min: number; max: number } {
  if (level === 'advanced') return { min: 12, max: 20 };
  if (level === 'intermediate') return { min: 10, max: 16 };
  return { min: 6, max: 12 };
}

export type RecoveryStatus = 'fresh' | 'recovering' | 'strained';

/** Bölge başına son çalışma zamanı → dinlenme durumu (48-72s pencere) */
export function muscleRecovery(
  sessions: SessionLog[]
): { bodyPart: string; hoursAgo: number; status: RecoveryStatus }[] {
  const last = new Map<string, number>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const e = getExercise(ex.exerciseId);
      if (!e) continue;
      const cur = last.get(e.bodyPart) ?? 0;
      if (s.endedAt > cur) last.set(e.bodyPart, s.endedAt);
    }
  }
  return [...last.entries()]
    .map(([bodyPart, at]) => {
      const hoursAgo = (Date.now() - at) / 3600000;
      const status: RecoveryStatus =
        hoursAgo >= 72 ? 'fresh' : hoursAgo >= 48 ? 'recovering' : 'strained';
      return { bodyPart, hoursAgo, status };
    })
    .sort((a, b) => a.hoursAgo - b.hoursAgo);
}

/** Egzersiz için son antrenmandaki ağırlık (progressive overload önerisi) */
export function lastWeight(sessions: SessionLog[], exerciseId: string): number | null {
  for (const s of sessions) {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId);
    const w = log?.weights?.filter((x): x is number => x != null && x > 0);
    if (w?.length) return w[w.length - 1];
  }
  return null;
}
