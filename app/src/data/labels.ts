export const BODY_PART_TR: Record<string, string> = {
  back: 'Sırt',
  cardio: 'Kardiyo',
  chest: 'Göğüs',
  'lower arms': 'Ön Kol',
  'lower legs': 'Alt Bacak',
  neck: 'Boyun',
  shoulders: 'Omuz',
  'upper arms': 'Üst Kol',
  'upper legs': 'Üst Bacak',
  waist: 'Karın / Bel',
};

export const EQUIPMENT_TR: Record<string, string> = {
  assisted: 'Destekli',
  band: 'Direnç Bandı',
  barbell: 'Barbell',
  'body weight': 'Vücut Ağırlığı',
  'bosu ball': 'Bosu Topu',
  cable: 'Kablo',
  dumbbell: 'Dambıl',
  'elliptical machine': 'Eliptik',
  'ez barbell': 'EZ Bar',
  hammer: 'Hammer',
  kettlebell: 'Kettlebell',
  'leverage machine': 'Makine',
  'medicine ball': 'Sağlık Topu',
  'olympic barbell': 'Olimpik Bar',
  'resistance band': 'Direnç Bandı',
  roller: 'Roller',
  rope: 'Halat',
  'skierg machine': 'SkiErg',
  'sled machine': 'Sled',
  'smith machine': 'Smith Machine',
  'stability ball': 'Pilates Topu',
  'stationary bike': 'Sabit Bisiklet',
  'stepmill machine': 'Stepmill',
  tire: 'Lastik',
  'trap bar': 'Trap Bar',
  'upper body ergometer': 'Ergometre',
  weighted: 'Ağırlıklı',
  'wheel roller': 'Karın Tekeri',
};

export const TARGET_TR: Record<string, string> = {
  abductors: 'Dış Bacak',
  abs: 'Karın',
  adductors: 'İç Bacak',
  biceps: 'Biceps',
  calves: 'Baldır',
  'cardiovascular system': 'Kardiyovasküler',
  delts: 'Omuz (Deltoid)',
  forearms: 'Ön Kol',
  glutes: 'Kalça',
  hamstrings: 'Arka Bacak',
  lats: 'Kanat (Lat)',
  'levator scapulae': 'Levator Scapulae',
  pectorals: 'Göğüs',
  quads: 'Ön Bacak',
  'serratus anterior': 'Serratus',
  spine: 'Omurga',
  traps: 'Trapez',
  triceps: 'Triceps',
  'upper back': 'Üst Sırt',
};

export const MUSCLE_TR: Record<string, string> = {
  ...TARGET_TR,
  'hip flexors': 'Kalça Fleksörleri',
  'lower back': 'Bel / Alt Sırt',
  'obliques': 'Yan Karın',
  'rhomboids': 'Rhomboid',
  'rotator cuff': 'Rotator Cuff',
  'soleus': 'Soleus',
  'sternocleidomastoid': 'Boyun Kasları',
  'wrist extensors': 'Bilek Ekstansörleri',
  'wrist flexors': 'Bilek Fleksörleri',
  brachialis: 'Brachialis',
  brachioradialis: 'Brachioradialis',
  'core': 'Core',
  'erector spinae': 'Erector Spinae',
  'infraspinatus': 'Infraspinatus',
  'latissimus dorsi': 'Kanat (Lat)',
  'pectoralis major': 'Göğüs',
  'pectoralis minor': 'Göğüs',
  'sartorius': 'Sartorius',
  'tensor fasciae latae': 'Tensor Fasciae Latae',
  'teres major': 'Teres Major',
  'tibialis anterior': 'Tibialis Anterior',
  'vastus lateralis': 'Ön Bacak',
  'vastus medialis': 'Ön Bacak',
  quadriceps: 'Ön Bacak',
  chest: 'Göğüs',
  shoulders: 'Omuz',
  back: 'Sırt',
  trapezius: 'Trapez',
  deltoids: 'Omuz (Deltoid)',
  'rear deltoids': 'Arka Omuz',
  abdominals: 'Karın',
  'lower abs': 'Alt Karın',
  'ankle stabilizers': 'Ayak Bileği',
  ankles: 'Ayak Bileği',
  feet: 'Ayak',
  wrists: 'Bilek',
  hands: 'El / Kavrama',
  'grip muscles': 'Kavrama Kasları',
  'inner thighs': 'İç Bacak',
  groin: 'Kasık',
  shins: 'Kaval Kemiği',
  'upper chest': 'Üst Göğüs',
};

export const tr = (map: Record<string, string>, key: string): string => map[key] ?? key;

export const GOALS = [
  { id: 'muscle', label: 'Kas Kazanımı', labelEn: 'Muscle Gain', icon: 'Dumbbell' },
  { id: 'fatloss', label: 'Yağ Yakımı', labelEn: 'Fat Loss', icon: 'Flame' },
  { id: 'strength', label: 'Güç', labelEn: 'Strength', icon: 'Zap' },
  { id: 'general', label: 'Genel Fitness', labelEn: 'General Fitness', icon: 'Heart' },
] as const;

export const LEVELS = [
  { id: 'beginner', label: 'Başlangıç', labelEn: 'Beginner' },
  { id: 'intermediate', label: 'Orta Seviye', labelEn: 'Intermediate' },
  { id: 'advanced', label: 'İleri Seviye', labelEn: 'Advanced' },
] as const;

export type GoalId = (typeof GOALS)[number]['id'];
export type LevelId = (typeof LEVELS)[number]['id'];

export const GENDERS = [
  { id: 'female', label: 'Kadın', labelEn: 'Female' },
  { id: 'male', label: 'Erkek', labelEn: 'Male' },
  { id: 'other', label: 'Diğer', labelEn: 'Other' },
] as const;

export const LOCATIONS = [
  { id: 'home', label: 'Evde', labelEn: 'At Home' },
  { id: 'gym', label: 'Salonda', labelEn: 'At the Gym' },
  { id: 'anywhere', label: 'Fark etmez', labelEn: 'No Preference' },
] as const;
