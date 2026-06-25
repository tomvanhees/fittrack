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

export interface CategorySetsRow {
  category: Category;
  value: number;
}

/** Aantal gelogde sets per spiergroep vanaf `sinceISO` (incl.). */
export function getSetsByCategory(sinceISO: string): CategorySetsRow[] {
  return db.getAllSync<CategorySetsRow>(
    `SELECT e.category AS category,
            COUNT(ws.id) AS value
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

export interface ExerciseRecords {
  /** Zwaarste set ooit (kg) + bijhorende reps en datum. */
  maxWeight: { weight: number; reps: number; date: string } | null;
  /** Hoogste geschatte 1RM (Epley) + de set + datum waaruit ze komt. */
  bestEstimated1RM: { value: number; weight: number; reps: number; date: string } | null;
  /** Hoogste volume in één set (gewicht × reps). */
  bestSetVolume: { value: number; weight: number; reps: number; date: string } | null;
  /** Meeste reps in één set. */
  maxReps: { reps: number; weight: number; date: string } | null;
}

/**
 * Persoonlijke records voor één oefening, berekend uit alle gelogde sets.
 * Epley-1RM = gewicht × (1 + reps/30); 1 rep ⇒ gewicht zelf. Enkel sets met
 * gewicht > 0 en reps > 0 tellen mee.
 */
export function getExerciseRecords(exerciseId: number): ExerciseRecords {
  const sets = db.getAllSync<{ weight: number; reps: number; date: string }>(
    `SELECT ws.weight AS weight, ws.reps AS reps, wd.date AS date
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE we.exercise_id = ?
        AND we.deleted = 0
        AND ws.deleted = 0
        AND ws.weight > 0
        AND ws.reps > 0`,
    [exerciseId]
  );

  const records: ExerciseRecords = {
    maxWeight: null,
    bestEstimated1RM: null,
    bestSetVolume: null,
    maxReps: null,
  };

  for (const s of sets) {
    const e1rm = s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30);
    const volume = s.weight * s.reps;

    if (!records.maxWeight || s.weight > records.maxWeight.weight) {
      records.maxWeight = { weight: s.weight, reps: s.reps, date: s.date };
    }
    if (!records.bestEstimated1RM || e1rm > records.bestEstimated1RM.value) {
      records.bestEstimated1RM = { value: e1rm, weight: s.weight, reps: s.reps, date: s.date };
    }
    if (!records.bestSetVolume || volume > records.bestSetVolume.value) {
      records.bestSetVolume = { value: volume, weight: s.weight, reps: s.reps, date: s.date };
    }
    if (!records.maxReps || s.reps > records.maxReps.reps) {
      records.maxReps = { reps: s.reps, weight: s.weight, date: s.date };
    }
  }

  return records;
}

/** Eén regel in het gecombineerde records-overzicht ("high scores"). */
export interface ExerciseRecordSummary {
  exerciseId: number;
  name: string;
  category: Category;
  /** Hoogste geschatte 1RM (Epley) over alle gelogde sets. */
  bestEstimated1RM: number;
  /** Zwaarste gelogde set (kg). */
  maxWeight: number;
  /** Hoogste volume in één set (gewicht × reps). */
  bestSetVolume: number;
  /** Meeste reps in één set. */
  maxReps: number;
  /** Aantal meetellende sets (gewicht > 0 én reps > 0). */
  setCount: number;
  /** Meest recente datum met een meetellende set. */
  lastDate: string;
}

/**
 * Records voor álle oefeningen met minstens één meetellende set (gewicht > 0
 * én reps > 0), in één query berekend en in JS geaggregeerd. Gesorteerd op
 * geschatte 1RM (aflopend) — de "high scores". Oefeningen zonder gelogde sets
 * komen niet voor in het resultaat.
 */
export function getAllExerciseRecords(): ExerciseRecordSummary[] {
  const rows = db.getAllSync<{
    exercise_id: number;
    name: string;
    category: string;
    weight: number;
    reps: number;
    date: string;
  }>(
    `SELECT e.id AS exercise_id, e.name AS name, e.category AS category,
            ws.weight AS weight, ws.reps AS reps, wd.date AS date
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
       JOIN exercises e ON e.id = we.exercise_id
      WHERE we.deleted = 0
        AND ws.deleted = 0
        AND ws.weight > 0
        AND ws.reps > 0`
  );

  const byExercise = new Map<number, ExerciseRecordSummary>();
  for (const r of rows) {
    const e1rm = r.reps === 1 ? r.weight : r.weight * (1 + r.reps / 30);
    const volume = r.weight * r.reps;
    let agg = byExercise.get(r.exercise_id);
    if (!agg) {
      agg = {
        exerciseId: r.exercise_id,
        name: r.name,
        category: r.category as Category,
        bestEstimated1RM: 0,
        maxWeight: 0,
        bestSetVolume: 0,
        maxReps: 0,
        setCount: 0,
        lastDate: r.date,
      };
      byExercise.set(r.exercise_id, agg);
    }
    agg.bestEstimated1RM = Math.max(agg.bestEstimated1RM, e1rm);
    agg.maxWeight = Math.max(agg.maxWeight, r.weight);
    agg.bestSetVolume = Math.max(agg.bestSetVolume, volume);
    agg.maxReps = Math.max(agg.maxReps, r.reps);
    agg.setCount += 1;
    if (r.date > agg.lastDate) agg.lastDate = r.date;
  }

  return [...byExercise.values()].sort(
    (a, b) => b.bestEstimated1RM - a.bestEstimated1RM
  );
}

/**
 * Beste geschatte 1RM (Epley) voor een oefening uit sessies strikt vóór
 * `beforeISO`. Wordt gebruikt om te bepalen of de set van vandaag een nieuw
 * record vestigt. Geeft 0 wanneer er nog geen eerdere data is.
 */
export function getBestEstimated1RMBefore(exerciseId: number, beforeISO: string): number {
  const row = db.getFirstSync<{ best: number | null }>(
    `SELECT MAX(
              CASE WHEN ws.reps = 1 THEN ws.weight
                   ELSE ws.weight * (1 + ws.reps / 30.0) END
            ) AS best
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE we.exercise_id = ?
        AND wd.date < ?
        AND we.deleted = 0
        AND ws.deleted = 0
        AND ws.weight > 0
        AND ws.reps > 0`,
    [exerciseId, beforeISO]
  );
  return row?.best ?? 0;
}
