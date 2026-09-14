import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Routine, RoutineExercise } from '../data/programs';
import type { GoalId, LevelId } from '../data/labels';

export interface SessionExerciseLog {
  exerciseId: string;
  name: string;
  setsCompleted: number;
  repsCompleted: number; // timed için toplam saniye
  timed: boolean;
  /** Set başına kg — ağırlıksız hareketlerde boş */
  weights?: (number | null)[];
}

export interface SessionLog {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  totalSets: number;
  exercises: SessionExerciseLog[];
  /** Bu antrenmanda kırılan PR'ların egzersiz id'leri */
  newPrs?: string[];
}

export interface PRRecord {
  weight: number;
  reps: number;
  at: number;
}

export type Gender = 'male' | 'female' | 'other';
export type LocationPref = 'home' | 'gym' | 'anywhere';

export interface ProfileStats {
  gender: Gender | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  daysPerWeek: number | null;
  preferredLocation: LocationPref | null;
}

interface AppState extends ProfileStats {
  hydrated: boolean;
  onboarded: boolean;
  name: string;
  goal: GoalId;
  level: LevelId;
  restSec: number;
  instructionLang: 'tr' | 'en';
  favorites: string[];
  customRoutines: Routine[];
  sessions: SessionLog[];
  /** exerciseId -> en iyi ağırlık kaydı */
  prs: Record<string, PRRecord>;
  /** Builder'a egzersiz seçimini taşımak için geçici alan (persist edilmez) */
  pendingPick: string | null;

  setHydrated: (v: boolean) => void;
  setPendingPick: (id: string | null) => void;
  completeOnboarding: (
    p: { name: string; goal: GoalId; level: LevelId } & ProfileStats
  ) => void;
  updateStats: (p: Partial<ProfileStats>) => void;
  setName: (name: string) => void;
  setGoal: (g: GoalId) => void;
  setLevel: (l: LevelId) => void;
  setRestSec: (s: number) => void;
  setInstructionLang: (l: 'tr' | 'en') => void;
  toggleFavorite: (id: string) => void;
  saveCustomRoutine: (r: Routine) => void;
  deleteCustomRoutine: (id: string) => void;
  logSession: (s: SessionLog) => void;
  recordPR: (exerciseId: string, weight: number, reps: number) => boolean;
  deleteSession: (id: string) => void;
  resetAll: () => void;
}

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboarded: false,
      name: '',
      goal: 'general',
      level: 'beginner',
      restSec: 60,
      gender: null,
      age: null,
      heightCm: null,
      weightKg: null,
      targetWeightKg: null,
      daysPerWeek: null,
      preferredLocation: null,
      instructionLang: 'tr',
      favorites: [],
      customRoutines: [],
      sessions: [],
      prs: {},
      pendingPick: null,

      setHydrated: (v) => set({ hydrated: v }),
      setPendingPick: (id) => set({ pendingPick: id }),
      completeOnboarding: ({ name, goal, level, ...stats }) =>
        set({ onboarded: true, name, goal, level, ...stats }),
      updateStats: (p) => set(p),
      setName: (name) => set({ name }),
      setGoal: (goal) => set({ goal }),
      setLevel: (level) => set({ level }),
      setRestSec: (restSec) => set({ restSec }),
      setInstructionLang: (instructionLang) => set({ instructionLang }),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      saveCustomRoutine: (r) =>
        set((s) => {
          const i = s.customRoutines.findIndex((c) => c.id === r.id);
          const customRoutines = [...s.customRoutines];
          if (i >= 0) customRoutines[i] = r;
          else customRoutines.push(r);
          return { customRoutines };
        }),
      deleteCustomRoutine: (id) =>
        set((s) => ({ customRoutines: s.customRoutines.filter((c) => c.id !== id) })),
      logSession: (s) => set((st) => ({ sessions: [s, ...st.sessions] })),
      recordPR: (exerciseId, weight, reps) => {
        let improved = false;
        set((s) => {
          const cur = s.prs[exerciseId];
          // daha ağır, ya da aynı ağırlıkta daha fazla tekrar = yeni rekor
          if (!cur || weight > cur.weight || (weight === cur.weight && reps > cur.reps)) {
            improved = true;
            return { prs: { ...s.prs, [exerciseId]: { weight, reps, at: Date.now() } } };
          }
          return {};
        });
        return improved;
      },
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      resetAll: () =>
        set({
          onboarded: false,
          name: '',
          goal: 'general',
          level: 'beginner',
          restSec: 60,
          gender: null,
          age: null,
          heightCm: null,
          weightKg: null,
          targetWeightKg: null,
          daysPerWeek: null,
          preferredLocation: null,
          favorites: [],
          customRoutines: [],
          sessions: [],
          prs: {},
        }),
    }),
    {
      name: 'sporapp-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        name: s.name,
        goal: s.goal,
        level: s.level,
        restSec: s.restSec,
        gender: s.gender,
        age: s.age,
        heightCm: s.heightCm,
        weightKg: s.weightKg,
        targetWeightKg: s.targetWeightKg,
        daysPerWeek: s.daysPerWeek,
        preferredLocation: s.preferredLocation,
        instructionLang: s.instructionLang,
        favorites: s.favorites,
        customRoutines: s.customRoutines,
        sessions: s.sessions,
        prs: s.prs,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

/* ---------- derived stats ---------- */

export function totalWorkouts(sessions: SessionLog[]): number {
  return sessions.length;
}

export function totalMinutes(sessions: SessionLog[]): number {
  return Math.round(sessions.reduce((n, s) => n + s.durationSec, 0) / 60);
}

export function totalSets(sessions: SessionLog[]): number {
  return sessions.reduce((n, s) => n + s.totalSets, 0);
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function streakDays(sessions: SessionLog[]): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => dayKey(s.endedAt)));
  let streak = 0;
  const cursor = new Date();
  // bugün antrenman yoksa dünden başlat
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function weekActivity(
  sessions: SessionLog[],
  lang: 'tr' | 'en' = 'tr'
): { label: string; minutes: number; isToday: boolean }[] {
  const out: { label: string; minutes: number; isToday: boolean }[] = [];
  const dayNames =
    lang === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const minutes = Math.round(
      sessions.filter((s) => dayKey(s.endedAt) === key).reduce((n, s) => n + s.durationSec, 0) / 60
    );
    out.push({ label: dayNames[d.getDay()], minutes, isToday: i === 0 });
  }
  return out;
}
