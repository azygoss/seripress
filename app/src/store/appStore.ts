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
}

interface AppState {
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
  /** Builder'a egzersiz seçimini taşımak için geçici alan (persist edilmez) */
  pendingPick: string | null;

  setHydrated: (v: boolean) => void;
  setPendingPick: (id: string | null) => void;
  completeOnboarding: (p: { name: string; goal: GoalId; level: LevelId }) => void;
  setName: (name: string) => void;
  setGoal: (g: GoalId) => void;
  setLevel: (l: LevelId) => void;
  setRestSec: (s: number) => void;
  setInstructionLang: (l: 'tr' | 'en') => void;
  toggleFavorite: (id: string) => void;
  saveCustomRoutine: (r: Routine) => void;
  deleteCustomRoutine: (id: string) => void;
  logSession: (s: SessionLog) => void;
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
      instructionLang: 'tr',
      favorites: [],
      customRoutines: [],
      sessions: [],
      pendingPick: null,

      setHydrated: (v) => set({ hydrated: v }),
      setPendingPick: (id) => set({ pendingPick: id }),
      completeOnboarding: ({ name, goal, level }) =>
        set({ onboarded: true, name, goal, level }),
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
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      resetAll: () =>
        set({
          onboarded: false,
          name: '',
          goal: 'general',
          level: 'beginner',
          restSec: 60,
          favorites: [],
          customRoutines: [],
          sessions: [],
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
        instructionLang: s.instructionLang,
        favorites: s.favorites,
        customRoutines: s.customRoutines,
        sessions: s.sessions,
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

export function weekActivity(sessions: SessionLog[]): { label: string; minutes: number; isToday: boolean }[] {
  const out: { label: string; minutes: number; isToday: boolean }[] = [];
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
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
