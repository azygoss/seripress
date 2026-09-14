import rawExercises from './exercises.json';
import gifMap from './gifMap';
import imgMap from './imgMap';

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  bodyPart: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  gif: string;
  img: string;
  steps: { tr: string[]; en: string[] };
}

const CAP_AFTER = /(^|[-(/])([a-z])/g;

export function formatExerciseName(name: string, lang: 'tr' | 'en' = 'tr'): string {
  const male = lang === 'tr' ? 'Erkek' : 'Male';
  const female = lang === 'tr' ? 'Kadın' : 'Female';
  return name
    .replace(/\s*-\s*(?=\()/g, ' ')
    .replace(/\(\s*male\s*\)/gi, `(${male})`)
    .replace(/\(\s*female\s*\)/gi, `(${female})`)
    .replace(/\bmale\b/gi, male)
    .replace(/\bfemale\b/gi, female)
    .replace(/\bv\.\s*(\d+)/gi, 'V$1')
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(CAP_AFTER, (_, sep, c) => sep + c.toUpperCase()))
    .join(' ')
    .replace(/\bPov\b/g, 'POV')
    .replace(/\bEz\b/g, 'EZ');
}

export const EXERCISES: Exercise[] = (rawExercises as Exercise[]).map((e) => ({
  ...e,
  name: formatExerciseName(e.name, 'tr'),
  nameEn: formatExerciseName(e.name, 'en'),
}));

const byId = new Map<string, Exercise>(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

export function gifSource(id: string): number | undefined {
  return gifMap[id];
}

export function imgSource(id: string): number | undefined {
  return imgMap[id];
}

export const BODY_PARTS = [...new Set(EXERCISES.map((e) => e.bodyPart))].sort();
export const EQUIPMENTS = [...new Set(EXERCISES.map((e) => e.equipment))].sort();
export const TARGETS = [...new Set(EXERCISES.map((e) => e.target))].sort();

export function countByBodyPart(part: string): number {
  return EXERCISES.reduce((n, e) => (e.bodyPart === part ? n + 1 : n), 0);
}

const norm = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function searchExercises(
  query: string,
  filters: { bodyPart?: string | null; equipment?: string | null; target?: string | null },
  labelIndex?: Map<string, string>
): Exercise[] {
  const q = norm(query.trim());
  return EXERCISES.filter((e) => {
    if (filters.bodyPart && e.bodyPart !== filters.bodyPart) return false;
    if (filters.equipment && e.equipment !== filters.equipment) return false;
    if (filters.target && e.target !== filters.target) return false;
    if (!q) return true;
    const hay = norm(
      `${e.name} ${e.nameEn} ${e.bodyPart} ${e.equipment} ${e.target} ${e.muscleGroup} ${
        labelIndex?.get(e.id) ?? ''
      }`
    );
    return q.split(/\s+/).every((tok) => hay.includes(tok));
  });
}
