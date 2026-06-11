// db/queries/exercises.ts

import { db } from '../schema';
import type { Category, Exercise } from '@/types';

interface ExerciseRow {
  id: number;
  name: string;
  category: string;
  is_custom: number;
}

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    isCustom: row.is_custom === 1,
  };
}

export function getAllExercises(): Exercise[] {
  const rows = db.getAllSync<ExerciseRow>(
    'SELECT id, name, category, is_custom FROM exercises ORDER BY name COLLATE NOCASE ASC'
  );
  return rows.map(mapExercise);
}

export function getExerciseById(id: number): Exercise | null {
  const row = db.getFirstSync<ExerciseRow>(
    'SELECT id, name, category, is_custom FROM exercises WHERE id = ?',
    [id]
  );
  return row ? mapExercise(row) : null;
}

export function getExercisesByCategory(category: Category): Exercise[] {
  const rows = db.getAllSync<ExerciseRow>(
    'SELECT id, name, category, is_custom FROM exercises WHERE category = ? ORDER BY name COLLATE NOCASE ASC',
    [category]
  );
  return rows.map(mapExercise);
}

export function addCustomExercise(name: string, category: Category): Exercise {
  const result = db.runSync(
    'INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, 1)',
    [name.trim(), category]
  );
  return {
    id: result.lastInsertRowId,
    name: name.trim(),
    category,
    isCustom: true,
  };
}

export function updateExercise(id: number, name: string, category: Category): void {
  db.runSync('UPDATE exercises SET name = ?, category = ? WHERE id = ?', [
    name.trim(),
    category,
    id,
  ]);
}

/**
 * Verwijdert een (custom) oefening. Standaard oefeningen worden beschermd.
 * Geeft false terug als de oefening nog in gebruik is in een workout/template.
 */
export function deleteCustomExercise(id: number): boolean {
  const inUse = db.getFirstSync<{ count: number }>(
    `SELECT
       (SELECT COUNT(*) FROM workout_exercises WHERE exercise_id = ?) +
       (SELECT COUNT(*) FROM template_day_exercises WHERE exercise_id = ?) AS count`,
    [id, id]
  );
  if (inUse && inUse.count > 0) return false;

  db.runSync('DELETE FROM exercises WHERE id = ? AND is_custom = 1', [id]);
  return true;
}
