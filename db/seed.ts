// db/seed.ts

import { db } from './schema';
import type { Category } from '@/types';

interface SeedExercise {
  name: string;
  category: Category;
}

export const DEFAULT_EXERCISES: SeedExercise[] = [
  // Borst
  { name: 'Bench Press', category: 'borst' },
  { name: 'Incline Dumbbell Press', category: 'borst' },
  { name: 'Cable Fly', category: 'borst' },
  // Rug
  { name: 'Deadlift', category: 'rug' },
  { name: 'Pull-up', category: 'rug' },
  { name: 'Barbell Row', category: 'rug' },
  { name: 'Lat Pulldown', category: 'rug' },
  // Schouders
  { name: 'Overhead Press', category: 'schouders' },
  { name: 'Lateral Raise', category: 'schouders' },
  // Biceps
  { name: 'Barbell Curl', category: 'biceps' },
  { name: 'Hammer Curl', category: 'biceps' },
  // Triceps
  { name: 'Tricep Pushdown', category: 'triceps' },
  { name: 'Skull Crusher', category: 'triceps' },
  // Benen
  { name: 'Squat', category: 'benen' },
  { name: 'Romanian Deadlift', category: 'benen' },
  { name: 'Leg Press', category: 'benen' },
  { name: 'Leg Curl', category: 'benen' },
  // Core
  { name: 'Plank', category: 'core' },
  { name: 'Cable Crunch', category: 'core' },
];

/**
 * Seedt de standaard oefeningen exact één keer. Idempotent: als er al
 * standaard (niet-custom) oefeningen bestaan, gebeurt er niets.
 */
export function seedDefaultExercises() {
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises WHERE is_custom = 0'
  );

  if (row && row.count > 0) return;

  db.withTransactionSync(() => {
    for (const ex of DEFAULT_EXERCISES) {
      db.runSync(
        'INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, 0)',
        [ex.name, ex.category]
      );
    }
  });
}
