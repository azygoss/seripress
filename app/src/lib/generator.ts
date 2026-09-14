import { EXERCISES, type Exercise } from '../data/exercises';
import type { LevelId } from '../data/labels';
import type { Routine, RoutineExercise } from '../data/programs';
import { uid } from '../store/appStore';

export type EquipmentScope = 'none' | 'basic' | 'gym';

const BODYWEIGHT = new Set(['body weight', 'assisted']);
const BASIC = new Set([
  'body weight',
  'assisted',
  'band',
  'resistance band',
  'dumbbell',
  'kettlebell',
  'medicine ball',
  'stability ball',
  'roller',
  'wheel roller',
]);

const isTimed = (e: Exercise) =>
  e.target === 'cardiovascular system' || /plank|bridge|stretch|jump|jack|climber|crawl|hop|run/i.test(e.name);

export interface GenerateOptions {
  minutes: number;
  equipment: EquipmentScope;
  /** Boş dizi = tüm bölgeler */
  bodyParts: string[];
  level: LevelId;
}

interface Params {
  sets: number;
  reps: number;
  repsTimed: number;
  restSec: number;
  /** Süre dolmadan üst üste yapılan çift hareketler */
  supersetEvery: number;
}

const PARAMS: Record<LevelId, Params> = {
  beginner: { sets: 3, reps: 10, repsTimed: 25, restSec: 45, supersetEvery: 0 },
  intermediate: { sets: 3, reps: 12, repsTimed: 30, restSec: 60, supersetEvery: 4 },
  advanced: { sets: 4, reps: 10, repsTimed: 35, restSec: 75, supersetEvery: 3 },
};

/** Bir egzersiz bloğunun tahmini süresi (dk) */
function exMinutes(p: Params): number {
  const work = p.reps * 3.2;
  return (p.sets * work + (p.sets - 1) * p.restSec) / 60;
}

export function generateRoutine(opts: GenerateOptions): Routine {
  const p = PARAMS[opts.level] ?? PARAMS.beginner;
  const scopeSet = opts.equipment === 'none' ? BODYWEIGHT : opts.equipment === 'basic' ? BASIC : null;

  let pool = EXERCISES.filter(
    (e) => (!scopeSet || scopeSet.has(e.equipment)) && (!opts.bodyParts.length || opts.bodyParts.includes(e.bodyPart))
  );
  if (pool.length < 4) pool = EXERCISES.filter((e) => !scopeSet || scopeSet.has(e.equipment));
  if (!pool.length) pool = EXERCISES;

  // bölge başına round-robin havuz
  const byPart = new Map<string, Exercise[]>();
  for (const e of pool) {
    if (!byPart.has(e.bodyPart)) byPart.set(e.bodyPart, []);
    byPart.get(e.bodyPart)!.push(e);
  }
  const parts = [...byPart.keys()];
  // havuzları karıştır
  for (const list of byPart.values()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  // kaç egzersiz sığar
  const per = exMinutes(p);
  const count = Math.max(3, Math.min(10, Math.floor(opts.minutes / per)));

  const picked: Exercise[] = [];
  const used = new Set<string>();
  let pi = 0;
  while (picked.length < count && parts.length) {
    const list = byPart.get(parts[pi % parts.length])!;
    const next = list.find((e) => !used.has(e.id));
    if (next) {
      used.add(next.id);
      picked.push(next);
    } else {
      parts.splice(pi % parts.length, 1);
      continue;
    }
    pi++;
  }

  const exercises: RoutineExercise[] = picked.map((e) => {
    const timed = isTimed(e);
    return {
      exerciseId: e.id,
      sets: p.sets,
      reps: timed ? p.repsTimed : p.reps,
      restSec: p.restSec,
      timed,
    };
  });

  // ileri seviyelerde ardışık çiftleri superset'e çevir (aynı bölge üst üste gelmesin)
  if (p.supersetEvery) {
    let g = 0;
    for (let i = 0; i + 1 < exercises.length; i += 2) {
      const a = getPart(exercises[i]);
      const b = getPart(exercises[i + 1]);
      if (a && b && a !== b && (i / 2) % p.supersetEvery === 0) {
        g++;
        exercises[i].group = g;
        exercises[i + 1].group = g;
      }
    }
  }

  const name = `⚡ ${opts.minutes} dk`;
  return {
    id: `gen-${uid()}`,
    name,
    nameEn: `⚡ ${opts.minutes} min`,
    description: 'Otomatik üretilen program',
    descriptionEn: 'Auto-generated workout',
    level: opts.level,
    goals: ['general'],
    location: opts.equipment === 'gym' ? 'gym' : 'home',
    exercises,
  };
}

function getPart(re: RoutineExercise) {
  return EXERCISES.find((e) => e.id === re.exerciseId)?.bodyPart;
}
