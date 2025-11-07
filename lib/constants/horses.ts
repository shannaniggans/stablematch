export const RIDING_STYLE_OPTIONS = [
  { value: 'dressage', label: 'Dressage' },
  { value: 'show_jumping', label: 'Show Jumping' },
  { value: 'eventing', label: 'Eventing' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'western', label: 'Western' },
  { value: 'trail', label: 'Trail Riding' },
  { value: 'pleasure', label: 'Pleasure/Flatwork' },
  { value: 'reining', label: 'Reining' },
  { value: 'barrel_racing', label: 'Barrel Racing' },
  { value: 'vaulting', label: 'Vaulting' },
  { value: 'horsemanship', label: 'Horsemanship/Equitation' },
  { value: 'other', label: 'Other / Mixed' },
] as const;

export const RIDING_STYLE_VALUES = RIDING_STYLE_OPTIONS.map((option) => option.value) as [
  (typeof RIDING_STYLE_OPTIONS)[number]['value'],
  ...(typeof RIDING_STYLE_OPTIONS)[number]['value'][]
];

export const HORSE_EDUCATION_LEVEL_OPTIONS = [
  { value: 'green', label: 'Green' },
  { value: 'novice', label: 'Novice' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

export const HORSE_EDUCATION_LEVEL_VALUES = HORSE_EDUCATION_LEVEL_OPTIONS.map((option) => option.value) as [
  (typeof HORSE_EDUCATION_LEVEL_OPTIONS)[number]['value'],
  ...(typeof HORSE_EDUCATION_LEVEL_OPTIONS)[number]['value'][]
];

export const HORSE_SEX_OPTIONS = [
  { value: 'mare', label: 'Mare' },
  { value: 'gelding', label: 'Gelding' },
  { value: 'stallion', label: 'Stallion' },
] as const;

export const HORSE_SEX_VALUES = HORSE_SEX_OPTIONS.map((option) => option.value) as [
  (typeof HORSE_SEX_OPTIONS)[number]['value'],
  ...(typeof HORSE_SEX_OPTIONS)[number]['value'][]
];
