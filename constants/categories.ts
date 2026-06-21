// constants/categories.ts

import type { Category } from '@/types';

export interface CategoryMeta {
  key: Category;
  label: string;     // Nederlandse weergavenaam
  color: string;     // accentkleur voor chips/badges
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'borst', label: 'Borst', color: '#FF6B5E' },
  { key: 'rug', label: 'Rug', color: '#4D9BFF' },
  { key: 'schouders', label: 'Schouders', color: '#FFB13D' },
  { key: 'biceps', label: 'Biceps', color: '#A87BFF' },
  { key: 'triceps', label: 'Triceps', color: '#FF5CC4' },
  { key: 'voorarmen', label: 'Voorarmen', color: '#9BE03D' },
  { key: 'benen', label: 'Benen', color: '#3DE08C' },
  { key: 'core', label: 'Core', color: '#2EE0D0' },
  { key: 'cardio', label: 'Cardio', color: '#FF8A3D' },
  { key: 'custom', label: 'Eigen', color: '#9A948A' },
];

const CATEGORY_MAP: Record<Category, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<Category, CategoryMeta>
);

export function categoryLabel(category: Category): string {
  return CATEGORY_MAP[category]?.label ?? category;
}

export function categoryColor(category: Category): string {
  return CATEGORY_MAP[category]?.color ?? '#9A948A';
}

// Weekdagen — index 0 = zondag t/m 6 = zaterdag (matcht TemplateDay.weekday)
export const WEEKDAY_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
export const WEEKDAY_LABELS_LONG = [
  'Zondag', 'Maandag', 'Dinsdag', 'Woensdag',
  'Donderdag', 'Vrijdag', 'Zaterdag',
];
export const MONTH_LABELS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
