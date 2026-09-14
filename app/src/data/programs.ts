import type { GoalId, LevelId } from './labels';

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  /** Hedef tekrar (timed=true ise saniye cinsinden süre) */
  reps: number;
  /** true ise tekrar yerine süre sayılır (plank, kardiyo vb.) */
  timed?: boolean;
  restSec: number;
}

export interface Routine {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  level: LevelId;
  goals: GoalId[];
  location: 'home' | 'gym' | 'anywhere';
  exercises: RoutineExercise[];
  custom?: boolean;
  coverBodyPart?: string;
}

const ex = (exerciseId: string, sets: number, reps: number, restSec = 60, timed = false): RoutineExercise => ({
  exerciseId,
  sets,
  reps,
  restSec,
  timed,
});

export const PRESET_ROUTINES: Routine[] = [
  {
    id: 'preset-home-beginner',
    name: 'Evde Başlangıç',
    nameEn: 'Home Starter',
    description: 'Ekipmansız, tüm vücut. Spora yeni başlayanlar için ideal giriş programı.',
    descriptionEn: 'Bodyweight full-body. The ideal entry program for beginners.',
    level: 'beginner',
    goals: ['general', 'fatloss'],
    location: 'home',
    coverBodyPart: 'waist',
    exercises: [
      ex('0493', 3, 10, 45), // incline push-up
      ex('3523', 3, 12, 45), // glute bridge
      ex('3470', 3, 10, 45), // forward lunge
      ex('0276', 3, 10, 45), // dead bug
      ex('1373', 3, 15, 30), // standing calf raise
      ex('0705', 3, 25, 30, true), // side bridge
      ex('0630', 3, 30, 45, true), // mountain climber
    ],
  },
  {
    id: 'preset-full-body',
    name: 'Full Body Güç',
    nameEn: 'Full Body Strength',
    description: 'Bileşik hareketlerle tüm vücudu çalıştıran klasik güç antrenmanı.',
    descriptionEn: 'Classic strength training hitting the whole body with compound lifts.',
    level: 'intermediate',
    goals: ['strength', 'muscle'],
    location: 'gym',
    coverBodyPart: 'upper legs',
    exercises: [
      ex('0043', 4, 8, 120), // barbell full squat
      ex('0025', 4, 8, 120), // barbell bench press
      ex('0027', 4, 10, 90), // barbell bent over row
      ex('0405', 3, 10, 90), // dumbbell seated shoulder press
      ex('0085', 3, 10, 90), // romanian deadlift
      ex('0464', 3, 40, 45, true), // front plank with twist
    ],
  },
  {
    id: 'preset-push',
    name: 'Push Günü (İtiş)',
    nameEn: 'Push Day',
    description: 'Göğüs, omuz ve triceps odaklı itiş antrenmanı.',
    descriptionEn: 'Push workout focused on chest, shoulders and triceps.',
    level: 'intermediate',
    goals: ['muscle', 'strength'],
    location: 'gym',
    coverBodyPart: 'chest',
    exercises: [
      ex('0025', 4, 8, 120), // barbell bench press
      ex('0314', 3, 10, 90), // dumbbell incline bench press
      ex('0405', 3, 10, 90), // dumbbell seated shoulder press
      ex('0334', 3, 12, 60), // dumbbell lateral raise
      ex('0241', 3, 12, 60), // cable triceps pushdown
      ex('0129', 3, 12, 60), // bench dip
    ],
  },
  {
    id: 'preset-pull',
    name: 'Pull Günü (Çekiş)',
    nameEn: 'Pull Day',
    description: 'Sırt ve biceps odaklı çekiş antrenmanı.',
    descriptionEn: 'Pull workout focused on back and biceps.',
    level: 'intermediate',
    goals: ['muscle', 'strength'],
    location: 'gym',
    coverBodyPart: 'back',
    exercises: [
      ex('0652', 4, 8, 120), // pull-up
      ex('0027', 4, 10, 90), // barbell bent over row
      ex('2330', 3, 10, 90), // cable lat pulldown
      ex('0861', 3, 10, 60), // cable seated row
      ex('0031', 3, 12, 60), // barbell curl
      ex('0313', 3, 12, 60), // hammer curl
    ],
  },
  {
    id: 'preset-legs',
    name: 'Legs Günü (Bacak)',
    nameEn: 'Leg Day',
    description: 'Ön bacak, arka bacak, kalça ve baldır için komple bacak antrenmanı.',
    descriptionEn: 'Complete leg training for quads, hamstrings, glutes and calves.',
    level: 'intermediate',
    goals: ['muscle', 'strength'],
    location: 'gym',
    coverBodyPart: 'upper legs',
    exercises: [
      ex('0043', 4, 8, 120), // barbell full squat
      ex('0085', 3, 10, 90), // romanian deadlift
      ex('0585', 3, 12, 60), // lever leg extension
      ex('0586', 3, 12, 60), // lever lying leg curl
      ex('1460', 3, 12, 60), // walking lunge
      ex('0594', 4, 15, 45), // lever seated calf raise
    ],
  },
  {
    id: 'preset-core',
    name: 'Karın & Core',
    nameEn: 'Abs & Core',
    description: 'Karın kasları ve merkez bölgesi için yoğun core antrenmanı.',
    descriptionEn: 'Intense core workout for abs and midsection.',
    level: 'beginner',
    goals: ['muscle', 'fatloss', 'general'],
    location: 'anywhere',
    coverBodyPart: 'waist',
    exercises: [
      ex('0274', 3, 15, 30), // crunch floor
      ex('0687', 3, 20, 30), // russian twist
      ex('0472', 3, 10, 45), // hanging leg raise
      ex('0459', 3, 30, 30, true), // flutter kicks
      ex('0003', 3, 20, 30), // air bike
      ex('0872', 3, 15, 30), // reverse crunch
      ex('0705', 2, 30, 30, true), // side bridge
    ],
  },
  {
    id: 'preset-hiit',
    name: 'HIIT Kardiyo',
    nameEn: 'HIIT Cardio',
    description: 'Ekipmansız yüksek tempolu yağ yakım antrenmanı.',
    descriptionEn: 'High-tempo bodyweight fat-burn workout.',
    level: 'advanced',
    goals: ['fatloss'],
    location: 'anywhere',
    coverBodyPart: 'cardio',
    exercises: [
      ex('1160', 4, 40, 30, true), // burpee
      ex('0630', 4, 40, 30, true), // mountain climber
      ex('0514', 4, 15, 45), // jump squat
      ex('3360', 3, 30, 45, true), // bear crawl
      ex('3655', 3, 30, 30, true), // high knees lunge
      ex('1473', 3, 15, 45), // backward jump
    ],
  },
  {
    id: 'preset-morning',
    name: 'Sabah Aktivasyonu',
    nameEn: 'Morning Activation',
    description: 'Güne zinde başlamak için hafif mobilite ve esneme rutini.',
    descriptionEn: 'Light mobility and stretching routine to start the day fresh.',
    level: 'beginner',
    goals: ['general'],
    location: 'anywhere',
    coverBodyPart: 'waist',
    exercises: [
      ex('3224', 2, 30, 20, true), // jack jump
      ex('1512', 2, 40, 20, true), // all fours squad stretch
      ex('1494', 2, 40, 20, true), // butterfly yoga pose
      ex('1585', 2, 40, 20, true), // runners stretch
      ex('1363', 2, 40, 20, true), // spine stretch
      ex('1403', 2, 30, 15, true), // neck side stretch
      ex('0690', 2, 40, 20, true), // seated lower back stretch
    ],
  },
  {
    id: 'preset-arms',
    name: 'Kol Günü (Biceps + Triceps)',
    nameEn: 'Arm Day (Biceps + Triceps)',
    description: 'Kol hacmi için biceps ve triceps odaklı izolasyon antrenmanı.',
    descriptionEn: 'Isolation work focused on biceps and triceps for arm size.',
    level: 'intermediate',
    goals: ['muscle'],
    location: 'gym',
    coverBodyPart: 'upper arms',
    exercises: [
      ex('0031', 4, 10, 75), // barbell curl
      ex('0060', 4, 10, 75), // skull crusher
      ex('0313', 3, 12, 60), // hammer curl
      ex('0241', 3, 12, 60), // cable triceps pushdown
      ex('0070', 3, 10, 60), // preacher curl
      ex('0129', 3, 12, 60), // bench dip
    ],
  },
  {
    id: 'preset-shoulders',
    name: 'Omuz & Trapez',
    nameEn: 'Shoulders & Traps',
    description: 'Geniş ve güçlü omuzlar için deltoid ve trapez odaklı program.',
    descriptionEn: 'Deltoid and trap focused program for broad, strong shoulders.',
    level: 'intermediate',
    goals: ['muscle', 'strength'],
    location: 'gym',
    coverBodyPart: 'shoulders',
    exercises: [
      ex('0405', 4, 10, 90), // dumbbell seated shoulder press
      ex('0334', 4, 12, 60), // dumbbell lateral raise
      ex('0310', 3, 12, 60), // dumbbell front raise
      ex('0203', 3, 12, 60), // cable rear delt row
      ex('2137', 3, 10, 75), // dumbbell arnold press
      ex('0220', 3, 15, 60), // cable shrug
    ],
  },
  {
    id: 'preset-chest',
    name: 'Göğüs Günü',
    nameEn: 'Chest Day',
    description: 'Göğüs kaslarını her açıdan çalıştıran pres ve fly kombinasyonu.',
    descriptionEn: 'Press and fly combination hitting the chest from every angle.',
    level: 'intermediate',
    goals: ['muscle'],
    location: 'gym',
    coverBodyPart: 'chest',
    exercises: [
      ex('0025', 4, 8, 120), // barbell bench press
      ex('0314', 4, 10, 90), // dumbbell incline bench press
      ex('0171', 3, 12, 60), // cable incline fly
      ex('0151', 3, 10, 75), // cable bench press
      ex('0251', 3, 10, 75), // chest dip
      ex('0129', 2, 15, 60), // bench dip
    ],
  },
  {
    id: 'preset-glutes-home',
    name: 'Kalça & Bacak (Ev)',
    nameEn: 'Glutes & Legs (Home)',
    description: 'Ekipmansız kalça ve bacak şekillendirme programı.',
    descriptionEn: 'Bodyweight glute and leg sculpting program.',
    level: 'beginner',
    goals: ['muscle', 'general'],
    location: 'home',
    coverBodyPart: 'upper legs',
    exercises: [
      ex('3523', 4, 15, 45), // glute bridge
      ex('3470', 3, 10, 45), // forward lunge
      ex('3769', 3, 12, 45), // curtsey squat
      ex('3561', 3, 12, 45), // glute bridge march
      ex('3645', 3, 10, 45), // single leg bridge
      ex('0284', 3, 15, 30), // donkey calf raise
      ex('2571', 2, 40, 20, true), // rocking frog stretch
    ],
  },
  {
    id: 'preset-kettlebell',
    name: 'Kettlebell Güç',
    nameEn: 'Kettlebell Power',
    description: 'Tek kettlebell ile patlayıcı güç ve kondisyon geliştiren program.',
    descriptionEn: 'Explosive power and conditioning with a single kettlebell.',
    level: 'intermediate',
    goals: ['strength', 'fatloss'],
    location: 'anywhere',
    coverBodyPart: 'upper legs',
    exercises: [
      ex('0549', 4, 15, 60), // kettlebell swing
      ex('0534', 4, 10, 75), // goblet squat
      ex('0541', 3, 10, 60), // one arm row
      ex('0550', 3, 8, 75), // thruster
      ex('0528', 3, 8, 75), // double push press
      ex('0532', 3, 30, 45, true), // figure 8
    ],
  },
  {
    id: 'preset-band',
    name: 'Direnç Bandı Tüm Vücut',
    nameEn: 'Resistance Band Full Body',
    description: 'Tek direnç bandı ile evde uygulanabilen tüm vücut programı.',
    descriptionEn: 'Full-body program you can do at home with a single band.',
    level: 'beginner',
    goals: ['general', 'muscle'],
    location: 'home',
    coverBodyPart: 'upper legs',
    exercises: [
      ex('1004', 3, 12, 45), // band squat
      ex('1254', 3, 12, 45), // band bench press
      ex('1022', 3, 12, 45), // band rear delt row
      ex('0997', 3, 10, 45), // band shoulder press
      ex('0968', 3, 12, 45), // band alternating curl
      ex('0991', 3, 12, 45), // band pull through
      ex('1408', 3, 15, 30), // band hip lift
    ],
  },
  {
    id: 'preset-circuit',
    name: 'Yağ Yakıcı Devre',
    nameEn: 'Fat-Burning Circuit',
    description: 'Kısa dinlenmelerle metabolizmayı hızlandıran devre antrenmanı.',
    descriptionEn: 'Circuit training with short rests to boost metabolism.',
    level: 'intermediate',
    goals: ['fatloss'],
    location: 'anywhere',
    coverBodyPart: 'cardio',
    exercises: [
      ex('3224', 4, 40, 30, true), // jack jump
      ex('1160', 4, 30, 30, true), // burpee
      ex('0630', 4, 40, 30, true), // mountain climber
      ex('3361', 3, 30, 30, true), // skater hops
      ex('0514', 3, 12, 45), // jump squat
      ex('3219', 3, 30, 30, true), // scissor jumps
    ],
  },
  {
    id: 'preset-stretch',
    name: 'Esneklik & Mobilite',
    nameEn: 'Flexibility & Mobility',
    description: 'Tüm vücut için rahatlama ve hareket açıklığı rutini.',
    descriptionEn: 'Relaxation and range-of-motion routine for the whole body.',
    level: 'beginner',
    goals: ['general'],
    location: 'anywhere',
    coverBodyPart: 'upper legs',
    exercises: [
      ex('1494', 2, 45, 15, true), // butterfly yoga pose
      ex('1511', 2, 45, 15, true), // hamstring stretch
      ex('1363', 2, 45, 15, true), // spine stretch
      ex('1405', 2, 40, 15, true), // back pec stretch
      ex('1271', 2, 40, 15, true), // chest & front shoulder stretch
      ex('1587', 2, 45, 15, true), // seated wide angle pose
      ex('0613', 2, 40, 15, true), // side quads stretch
      ex('1403', 2, 30, 15, true), // neck side stretch
    ],
  },
  {
    id: 'preset-calisthenics',
    name: 'Calisthenics İleri',
    nameEn: 'Advanced Calisthenics',
    description: 'Barfiks, dips ve ileri vücut ağırlığı hareketleriyle üst vücut ustalığı.',
    descriptionEn: 'Upper-body mastery with pull-ups, dips and advanced bodyweight moves.',
    level: 'advanced',
    goals: ['strength', 'muscle'],
    location: 'anywhere',
    coverBodyPart: 'back',
    exercises: [
      ex('0652', 4, 6, 120), // pull-up
      ex('1326', 3, 6, 90), // chin-up
      ex('0251', 4, 10, 90), // chest dip
      ex('3294', 3, 6, 90), // archer push up
      ex('0472', 3, 10, 60), // hanging leg raise
      ex('3360', 3, 30, 45, true), // bear crawl
    ],
  },
  {
    id: 'preset-dumbbell',
    name: 'Dambıl Tüm Vücut',
    nameEn: 'Dumbbell Full Body',
    description: 'Sadece dambıl ile evde veya salonda uygulanabilen tüm vücut programı.',
    descriptionEn: 'Full-body program doable at home or the gym with just dumbbells.',
    level: 'beginner',
    goals: ['muscle', 'general'],
    location: 'anywhere',
    coverBodyPart: 'upper arms',
    exercises: [
      ex('1760', 3, 12, 60), // goblet squat
      ex('0289', 3, 10, 75), // dumbbell bench press
      ex('0293', 3, 10, 75), // dumbbell bent over row
      ex('0426', 3, 10, 60), // standing overhead press
      ex('1459', 3, 10, 75), // dumbbell romanian deadlift
      ex('0294', 3, 12, 45), // biceps curl
      ex('0333', 3, 12, 45), // kickback
      ex('1373', 3, 15, 30), // calf raise
    ],
  },
];

export function routineExerciseCount(r: Routine): number {
  return r.exercises.length;
}

export function routineSetCount(r: Routine): number {
  return r.exercises.reduce((n, e) => n + e.sets, 0);
}

export function routineMinutes(r: Routine): number {
  const sec = r.exercises.reduce((n, e) => {
    const work = e.timed ? e.reps : e.reps * 3.2;
    return n + e.sets * work + (e.sets - 1) * e.restSec;
  }, 0);
  return Math.max(1, Math.round(sec / 60));
}

export function routineName(r: Routine, lang: 'tr' | 'en'): string {
  return lang === 'en' && r.nameEn ? r.nameEn : r.name;
}

export function routineDesc(r: Routine, lang: 'tr' | 'en'): string {
  return lang === 'en' && r.descriptionEn ? r.descriptionEn : r.description;
}

export function recommendedRoutineId(
  goal: GoalId | undefined,
  level: LevelId | undefined,
  location?: 'home' | 'gym' | 'anywhere' | null
): string {
  const locOk = (r: Routine) =>
    !location || location === 'anywhere' || r.location === 'anywhere' || r.location === location;

  // tam eşleşme: hedef + seviye + lokasyon
  const exact = PRESET_ROUTINES.find(
    (r) => (!goal || r.goals.includes(goal)) && (!level || r.level === level) && locOk(r)
  );
  if (exact) return exact.id;
  // seviye esnet
  const near = PRESET_ROUTINES.find((r) => (!goal || r.goals.includes(goal)) && locOk(r));
  if (near) return near.id;

  if (goal === 'fatloss')
    return level === 'advanced' ? 'preset-hiit' : level === 'intermediate' ? 'preset-circuit' : 'preset-home-beginner';
  if (goal === 'strength')
    return level === 'advanced' ? 'preset-calisthenics' : level === 'beginner' ? 'preset-dumbbell' : 'preset-full-body';
  if (goal === 'muscle') return level === 'beginner' ? 'preset-dumbbell' : 'preset-push';
  return level === 'advanced' ? 'preset-circuit' : 'preset-morning';
}
