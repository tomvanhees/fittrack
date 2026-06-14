// db/queries/workouts.ts

import { db } from '../schema';
import { getExerciseById } from './exercises';
import type {
  ExerciseWithSets,
  WorkoutDay,
  WorkoutExercise,
  WorkoutSet,
} from '@/types';

// ---------- Row types + mappers ----------

interface WorkoutDayRow {
  id: number;
  date: string;
  template_day_id: number | null;
  is_rest_day: number;
  completed_at: string | null;
}

interface WorkoutExerciseRow {
  id: number;
  workout_day_id: number;
  exercise_id: number;
  sort_order: number;
  planned_sets: number | null;
}

interface WorkoutSetRow {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  completed_at: string;
}

function mapDay(row: WorkoutDayRow): WorkoutDay {
  return {
    id: row.id,
    date: row.date,
    templateDayId: row.template_day_id ?? undefined,
    isRestDay: row.is_rest_day === 1,
    completedAt: row.completed_at ?? undefined,
  };
}

function mapExercise(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutDayId: row.workout_day_id,
    exerciseId: row.exercise_id,
    order: row.sort_order,
    plannedSets: row.planned_sets ?? undefined,
  };
}

function mapSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    weight: row.weight,
    reps: row.reps,
    completedAt: row.completed_at,
  };
}

// ---------- Workout days ----------

export function getWorkoutDayByDate(date: string): WorkoutDay | null {
  const row = db.getFirstSync<WorkoutDayRow>(
    'SELECT * FROM workout_days WHERE date = ?',
    [date]
  );
  return row ? mapDay(row) : null;
}

export function getOrCreateWorkoutDay(date: string): WorkoutDay {
  const existing = getWorkoutDayByDate(date);
  if (existing) return existing;

  db.runSync('INSERT INTO workout_days (date) VALUES (?)', [date]);
  return getWorkoutDayByDate(date)!;
}

export function getWorkoutDaysInRange(dates: string[]): WorkoutDay[] {
  if (dates.length === 0) return [];
  const placeholders = dates.map(() => '?').join(', ');
  const rows = db.getAllSync<WorkoutDayRow>(
    `SELECT * FROM workout_days WHERE date IN (${placeholders}) ORDER BY date ASC`,
    dates
  );
  return rows.map(mapDay);
}

export function setRestDay(date: string, isRestDay: boolean): void {
  const day = getOrCreateWorkoutDay(date);
  db.runSync('UPDATE workout_days SET is_rest_day = ? WHERE id = ?', [
    isRestDay ? 1 : 0,
    day.id,
  ]);
}

export function completeWorkout(date: string): void {
  const day = getOrCreateWorkoutDay(date);
  db.runSync(
    "UPDATE workout_days SET completed_at = datetime('now') WHERE id = ?",
    [day.id]
  );
}

export function reopenWorkout(date: string): void {
  db.runSync('UPDATE workout_days SET completed_at = NULL WHERE date = ?', [date]);
}

// ---------- Workout exercises ----------

export function getWorkoutExercises(workoutDayId: number): WorkoutExercise[] {
  const rows = db.getAllSync<WorkoutExerciseRow>(
    'SELECT * FROM workout_exercises WHERE workout_day_id = ? ORDER BY sort_order ASC, id ASC',
    [workoutDayId]
  );
  return rows.map(mapExercise);
}

export function addExerciseToDay(date: string, exerciseId: number): WorkoutExercise {
  const day = getOrCreateWorkoutDay(date);
  const next = db.getFirstSync<{ next: number }>(
    'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM workout_exercises WHERE workout_day_id = ?',
    [day.id]
  );
  const result = db.runSync(
    'INSERT INTO workout_exercises (workout_day_id, exercise_id, sort_order) VALUES (?, ?, ?)',
    [day.id, exerciseId, next?.next ?? 0]
  );
  return {
    id: result.lastInsertRowId,
    workoutDayId: day.id,
    exerciseId,
    order: next?.next ?? 0,
  };
}

export function removeWorkoutExercise(workoutExerciseId: number): void {
  // ON DELETE CASCADE ruimt de bijbehorende sets op.
  db.runSync('DELETE FROM workout_exercises WHERE id = ?', [workoutExerciseId]);
}

// ---------- Sets ----------

export function getSetsForWorkoutExercise(workoutExerciseId: number): WorkoutSet[] {
  const rows = db.getAllSync<WorkoutSetRow>(
    'SELECT * FROM workout_sets WHERE workout_exercise_id = ? ORDER BY set_number ASC',
    [workoutExerciseId]
  );
  return rows.map(mapSet);
}

/**
 * Voegt een nieuwe (lege) set toe aan een oefening met het volgende setnummer.
 */
export function addSet(workoutExerciseId: number): WorkoutSet {
  const next = db.getFirstSync<{ next: number }>(
    'SELECT COALESCE(MAX(set_number) + 1, 1) AS next FROM workout_sets WHERE workout_exercise_id = ?',
    [workoutExerciseId]
  );
  const setNumber = next?.next ?? 1;
  const result = db.runSync(
    'INSERT INTO workout_sets (workout_exercise_id, set_number, weight, reps) VALUES (?, ?, 0, 0)',
    [workoutExerciseId, setNumber]
  );
  return getSetById(result.lastInsertRowId)!;
}

export function getSetById(id: number): WorkoutSet | null {
  const row = db.getFirstSync<WorkoutSetRow>(
    'SELECT * FROM workout_sets WHERE id = ?',
    [id]
  );
  return row ? mapSet(row) : null;
}

/**
 * Werkt gewicht/reps van een set bij en ververst de timestamp.
 */
export function updateSet(
  setId: number,
  values: { weight?: number; reps?: number }
): void {
  const current = getSetById(setId);
  if (!current) return;
  const weight = values.weight ?? current.weight;
  const reps = values.reps ?? current.reps;
  db.runSync(
    "UPDATE workout_sets SET weight = ?, reps = ?, completed_at = datetime('now') WHERE id = ?",
    [weight, reps, setId]
  );
}

export function removeSet(setId: number): void {
  db.runSync('DELETE FROM workout_sets WHERE id = ?', [setId]);
}

/**
 * Upsert van een set op basis van (workoutExerciseId, setNumber). Maakt de
 * rij pas aan zodra de gebruiker effectief waarden invult — zo blijft een
 * niet-gelogde oefening buiten de "vorige sessie"-vergelijking.
 */
export function upsertSet(
  workoutExerciseId: number,
  setNumber: number,
  weight: number,
  reps: number
): WorkoutSet {
  const existing = db.getFirstSync<WorkoutSetRow>(
    'SELECT * FROM workout_sets WHERE workout_exercise_id = ? AND set_number = ?',
    [workoutExerciseId, setNumber]
  );
  if (existing) {
    db.runSync(
      "UPDATE workout_sets SET weight = ?, reps = ?, completed_at = datetime('now') WHERE id = ?",
      [weight, reps, existing.id]
    );
    return getSetById(existing.id)!;
  }
  const result = db.runSync(
    'INSERT INTO workout_sets (workout_exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?)',
    [workoutExerciseId, setNumber, weight, reps]
  );
  return getSetById(result.lastInsertRowId)!;
}

/** Verwijdert een set op basis van (workoutExerciseId, setNumber), indien aanwezig. */
export function removeSetByNumber(workoutExerciseId: number, setNumber: number): void {
  db.runSync(
    'DELETE FROM workout_sets WHERE workout_exercise_id = ? AND set_number = ?',
    [workoutExerciseId, setNumber]
  );
}

// ---------- Previous-session lookup ----------

/**
 * Sets van de meest recente eerdere sessie (vóór `beforeDate`) waarin deze
 * oefening werd uitgevoerd en minstens één set is gelogd.
 */
export function getPreviousSets(exerciseId: number, beforeDate: string): WorkoutSet[] {
  const we = db.getFirstSync<{ id: number }>(
    `SELECT we.id AS id
       FROM workout_exercises we
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE we.exercise_id = ?
        AND wd.date < ?
        AND EXISTS (SELECT 1 FROM workout_sets ws WHERE ws.workout_exercise_id = we.id)
      ORDER BY wd.date DESC
      LIMIT 1`,
    [exerciseId, beforeDate]
  );
  if (!we) return [];
  return getSetsForWorkoutExercise(we.id);
}

// ---------- Composite loaders ----------

/**
 * Bouwt het samengestelde model voor het Today-scherm: per oefening de
 * huidige sets én de sets van de vorige sessie.
 */
export function getWorkoutWithSets(date: string): ExerciseWithSets[] {
  const day = getWorkoutDayByDate(date);
  if (!day) return [];

  const workoutExercises = getWorkoutExercises(day.id);
  const result: ExerciseWithSets[] = [];

  for (const we of workoutExercises) {
    const exercise = getExerciseById(we.exerciseId);
    if (!exercise) continue;
    result.push({
      workoutExerciseId: we.id,
      exercise,
      previousSets: getPreviousSets(we.exerciseId, date),
      currentSets: getSetsForWorkoutExercise(we.id),
      plannedSets: we.plannedSets,
    });
  }

  return result;
}

/** Namen van de geplande oefeningen voor een dag (voor het weekoverzicht). */
export function getExerciseNamesForDay(workoutDayId: number): string[] {
  const rows = db.getAllSync<{ name: string }>(
    `SELECT e.name AS name
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
      WHERE we.workout_day_id = ?
      ORDER BY we.sort_order ASC, we.id ASC`,
    [workoutDayId]
  );
  return rows.map((r) => r.name);
}

/** Laatste N sessies (met sets) van een oefening — voor het detailscherm. */
export interface ExerciseSession {
  date: string;
  completedAt?: string;
  sets: WorkoutSet[];
}

export function getExerciseHistory(exerciseId: number, limit = 5): ExerciseSession[] {
  const rows = db.getAllSync<{ id: number; date: string; completed_at: string | null }>(
    `SELECT we.id AS id, wd.date AS date, wd.completed_at AS completed_at
       FROM workout_exercises we
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE we.exercise_id = ?
        AND EXISTS (SELECT 1 FROM workout_sets ws WHERE ws.workout_exercise_id = we.id)
      ORDER BY wd.date DESC
      LIMIT ?`,
    [exerciseId, limit]
  );

  return rows.map((r) => ({
    date: r.date,
    completedAt: r.completed_at ?? undefined,
    sets: getSetsForWorkoutExercise(r.id),
  }));
}
