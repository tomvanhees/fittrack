// db/queries/stats.ts
// Aggregaatqueries voor het Voortgang-scherm. Volume = Σ(gewicht × reps).

import { db } from '../schema';
import type { Category } from '@/types';
import type { Granularity } from '@/lib/stats';

/** strftime-formaat per granulariteit: maand → "2026-06", jaar → "2026". */
function periodFormat(granularity: Granularity): string {
  return granularity === 'month' ? '%Y-%m' : '%Y';
}

export interface PeriodRow {
  period: string;
  value: number;
}

/**
 * Aantal trainingsdagen per periode — dagen met minstens één gelogde set.
 * Rustdagen en lege geplande dagen tellen niet mee.
 */
export function getTrainingDaysByPeriod(granularity: Granularity): PeriodRow[] {
  return db.getAllSync<PeriodRow>(
    `SELECT strftime('${periodFormat(granularity)}', wd.date) AS period,
            COUNT(DISTINCT wd.id) AS value
       FROM workout_days wd
      WHERE EXISTS (
        SELECT 1 FROM workout_exercises we
          JOIN workout_sets ws ON ws.workout_exercise_id = we.id
         WHERE we.workout_day_id = wd.id
      )
      GROUP BY period`
  );
}

/** Totaal getild volume (Σ gewicht × reps) per periode. */
export function getVolumeByPeriod(granularity: Granularity): PeriodRow[] {
  return db.getAllSync<PeriodRow>(
    `SELECT strftime('${periodFormat(granularity)}', wd.date) AS period,
            SUM(ws.weight * ws.reps) AS value
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
      GROUP BY period`
  );
}

export interface CategoryVolumeRow {
  category: Category;
  value: number;
}

/** Volume per spiergroep vanaf `sinceISO` (incl.). */
export function getVolumeByCategory(sinceISO: string): CategoryVolumeRow[] {
  return db.getAllSync<CategoryVolumeRow>(
    `SELECT e.category AS category,
            SUM(ws.weight * ws.reps) AS value
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
       JOIN exercises e ON e.id = we.exercise_id
      WHERE wd.date >= ?
      GROUP BY e.category
      ORDER BY value DESC`,
    [sinceISO]
  );
}

export interface StrengthPoint {
  date: string; // ISO datum van de sessie
  value: number; // max gewicht (kg) in die sessie
}

/** Maximaal gewicht per sessie voor één oefening, vanaf `sinceISO`, oplopend in tijd. */
export function getStrengthProgression(exerciseId: number, sinceISO: string): StrengthPoint[] {
  return db.getAllSync<StrengthPoint>(
    `SELECT wd.date AS date, MAX(ws.weight) AS value
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE we.exercise_id = ?
        AND wd.date >= ?
        AND ws.weight > 0
      GROUP BY wd.date
      ORDER BY wd.date ASC`,
    [exerciseId, sinceISO]
  );
}

export interface TrackedExercise {
  id: number;
  name: string;
  category: Category;
}

/** Oefeningen waarvoor minstens één set is gelogd — voor de oefening-kiezer. */
export function getTrackedExercises(): TrackedExercise[] {
  return db.getAllSync<TrackedExercise>(
    `SELECT DISTINCT e.id AS id, e.name AS name, e.category AS category
       FROM exercises e
       JOIN workout_exercises we ON we.exercise_id = e.id
       JOIN workout_sets ws ON ws.workout_exercise_id = we.id
      ORDER BY e.name COLLATE NOCASE ASC`
  );
}

/** Snelle check: is er überhaupt al data gelogd? */
export function hasAnyLoggedSets(): boolean {
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM workout_sets'
  );
  return (row?.n ?? 0) > 0;
}
