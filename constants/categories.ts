// constants/categories.ts

import type { Category } from '@/types';

export interface CategoryMeta {
  key: Category;
  label: string;     // Nederlandse weergavenaam
  color: string;     // accentkleur voor chips/badges
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'borst', label: 'Borst', color: '#EF4444' },
  { key: 'rug', label: 'Rug', color: '#3B82F6' },
  { key: 'schouders', label: 'Schouders', color: '#F59E0B' },
  { key: 'biceps', label: 'Biceps', color: '#8B5CF6' },
  { key: 'triceps', label: 'Triceps', color: '#EC4899' },
  { key: 'voorarmen', label: 'Voorarmen', color: '#84CC16' },
  { key: 'benen', label: 'Benen', color: '#22C55E' },
  { key: 'core', label: 'Core', color: '#14B8A6' },
  { key: 'cardio', label: 'Cardio', color: '#F97316' },
  { key: 'custom', label: 'Eigen', color: '#8A97A6' },
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
  return CATEGORY_MAP[category]?.color ?? '#8A97A6';
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
