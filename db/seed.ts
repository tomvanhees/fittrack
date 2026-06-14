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
  { name: 'Dumbbell Bench Press', category: 'borst' },
  { name: 'Cable Fly', category: 'borst' },
  { name: 'Pec Deck', category: 'borst' },
  { name: 'Chest Dip', category: 'borst' },
  { name: 'Push-up', category: 'borst' },
  // Rug
  { name: 'Deadlift', category: 'rug' },
  { name: 'Pull-up', category: 'rug' },
  { name: 'Chin-up', category: 'rug' },
  { name: 'Barbell Row', category: 'rug' },
  { name: 'Seated Cable Row', category: 'rug' },
  { name: 'T-Bar Row', category: 'rug' },
  { name: 'Lat Pulldown', category: 'rug' },
  { name: 'Face Pull', category: 'rug' },
  // Schouders
  { name: 'Overhead Press', category: 'schouders' },
  { name: 'Arnold Press', category: 'schouders' },
  { name: 'Lateral Raise', category: 'schouders' },
  { name: 'Front Raise', category: 'schouders' },
  { name: 'Rear Delt Fly', category: 'schouders' },
  { name: 'Upright Row', category: 'schouders' },
  // Biceps
  { name: 'Barbell Curl', category: 'biceps' },
  { name: 'Hammer Curl', category: 'biceps' },
  { name: 'Preacher Curl', category: 'biceps' },
  { name: 'Concentration Curl', category: 'biceps' },
  { name: 'Cable Curl', category: 'biceps' },
  // Triceps
  { name: 'Tricep Pushdown', category: 'triceps' },
  { name: 'Skull Crusher', category: 'triceps' },
  { name: 'Overhead Tricep Extension', category: 'triceps' },
  { name: 'Close-Grip Bench Press', category: 'triceps' },
  { name: 'Tricep Dip', category: 'triceps' },
  // Voorarmen
  { name: 'Wrist Curl', category: 'voorarmen' },
  { name: 'Reverse Wrist Curl', category: 'voorarmen' },
  { name: 'Reverse Curl', category: 'voorarmen' },
  { name: 'Farmer\'s Walk', category: 'voorarmen' },
  { name: 'Wrist Roller', category: 'voorarmen' },
  // Benen
  { name: 'Squat', category: 'benen' },
  { name: 'Front Squat', category: 'benen' },
  { name: 'Romanian Deadlift', category: 'benen' },
  { name: 'Leg Press', category: 'benen' },
  { name: 'Leg Extension', category: 'benen' },
  { name: 'Leg Curl', category: 'benen' },
  { name: 'Lunge', category: 'benen' },
  { name: 'Bulgarian Split Squat', category: 'benen' },
  { name: 'Hip Thrust', category: 'benen' },
  { name: 'Calf Raise', category: 'benen' },
  // Core
  { name: 'Plank', category: 'core' },
  { name: 'Cable Crunch', category: 'core' },
  { name: 'Hanging Leg Raise', category: 'core' },
  { name: 'Russian Twist', category: 'core' },
  { name: 'Ab Wheel Rollout', category: 'core' },
  { name: 'Sit-up', category: 'core' },
  // Cardio
  { name: 'Treadmill Run', category: 'cardio' },
  { name: 'Cycling', category: 'cardio' },
  { name: 'Rowing Machine', category: 'cardio' },
  { name: 'Elliptical', category: 'cardio' },
  { name: 'Stair Climber', category: 'cardio' },
  { name: 'Jump Rope', category: 'cardio' },
];

/**
 * Seedt de standaard oefeningen. Idempotent én migratie-vriendelijk: enkel
 * oefeningen waarvan de naam nog niet bestaat worden toegevoegd. Zo krijgen
 * ook bestaande installaties nieuwe standaard oefeningen erbij, zonder
 * duplicaten en zonder reeds gelogde data te raken.
 */
export function seedDefaultExercises() {
  const existing = db.getAllSync<{ name: string }>('SELECT name FROM exercises');
  const existingNames = new Set(existing.map((r) => r.name.trim().toLowerCase()));

  const missing = DEFAULT_EXERCISES.filter(
    (e) => !existingNames.has(e.name.trim().toLowerCase())
  );
  if (missing.length === 0) return;

  db.withTransactionSync(() => {
    for (const ex of missing) {
      db.runSync(
        'INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, 0)',
        [ex.name, ex.category]
      );
    }
  });
}
