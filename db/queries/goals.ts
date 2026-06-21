// db/queries/goals.ts
// CRUD voor doelen + het berekenen van de huidige stand t.o.v. het target.
// De "current" waarde hergebruikt dezelfde aggregaten als het Voortgang-scherm:
//   strength    → hoogste ooit getild gewicht voor de oefening
//   consistency → aantal trainingsdagen in de lopende periode
//   volume      → totaal getild (Σ gewicht × reps) in de lopende periode

import { db } from '../schema';
import { goalStanding } from '@/lib/stats';
import type { Goal, GoalProgress, GoalType, Granularity } from '@/types';

interface GoalRow {
  id: number;
  type: string;
  exercise_id: number | null;
  target_value: number;
  target_reps: number | null;
  granularity: string | null;
  target_date: string | null;
  archived: number;
  created_at: string;
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    type: row.type as GoalType,
    exerciseId: row.exercise_id ?? undefined,
    targetValue: row.target_value,
    targetReps: row.target_reps ?? undefined,
    granularity: (row.granularity as Granularity | null) ?? undefined,
    targetDate: row.target_date ?? undefined,
    archived: row.archived === 1,
    createdAt: row.created_at,
  };
}

const SELECT_COLS =
  'id, type, exercise_id, target_value, target_reps, granularity, target_date, archived, created_at';

/** Alle doelen, actieve eerst, nieuwste bovenaan. Sluit tombstones uit. */
export function getGoals(includeArchived = true): Goal[] {
  const where = includeArchived ? 'deleted = 0' : 'deleted = 0 AND archived = 0';
  const rows = db.getAllSync<GoalRow>(
    `SELECT ${SELECT_COLS} FROM goals
      WHERE ${where}
      ORDER BY archived ASC, created_at DESC, id DESC`
  );
  return rows.map(mapGoal);
}

export function getGoalById(id: number): Goal | null {
  const row = db.getFirstSync<GoalRow>(
    `SELECT ${SELECT_COLS} FROM goals WHERE id = ? AND deleted = 0`,
    [id]
  );
  return row ? mapGoal(row) : null;
}

export interface NewGoal {
  type: GoalType;
  exerciseId?: number;
  targetValue: number;
  targetReps?: number;
  granularity?: Granularity;
  targetDate?: string;
}

export function createGoal(goal: NewGoal): number {
  const result = db.runSync(
    `INSERT INTO goals (type, exercise_id, target_value, target_reps, granularity, target_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      goal.type,
      goal.exerciseId ?? null,
      goal.targetValue,
      goal.targetReps ?? null,
      goal.granularity ?? null,
      goal.targetDate ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export function updateGoal(id: number, goal: NewGoal): void {
  db.runSync(
    `UPDATE goals
        SET type = ?, exercise_id = ?, target_value = ?, target_reps = ?,
            granularity = ?, target_date = ?
      WHERE id = ?`,
    [
      goal.type,
      goal.exerciseId ?? null,
      goal.targetValue,
      goal.targetReps ?? null,
      goal.granularity ?? null,
      goal.targetDate ?? null,
      id,
    ]
  );
}

export function setGoalArchived(id: number, archived: boolean): void {
  db.runSync('UPDATE goals SET archived = ? WHERE id = ?', [archived ? 1 : 0, id]);
}

/** Soft-delete (tombstone) zodat de verwijdering meesynchroniseert. */
export function deleteGoal(id: number): void {
  db.runSync('UPDATE goals SET deleted = 1 WHERE id = ?', [id]);
}

// ---------- Huidige stand per type ----------

/** strftime-formaat per granulariteit: maand → "%Y-%m", jaar → "%Y". */
function periodFormat(granularity: Granularity): string {
  return granularity === 'month' ? '%Y-%m' : '%Y';
}

/**
 * Hoogste ooit getilde gewicht (kg) voor één oefening, bij minstens `minReps`
 * reps. minReps = 1 telt elke set (gedrag zonder rep-target).
 */
function currentStrength(exerciseId: number, minReps: number): number {
  const row = db.getFirstSync<{ value: number | null }>(
    `SELECT MAX(ws.weight) AS value
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
      WHERE we.exercise_id = ? AND ws.weight > 0 AND ws.reps >= ?`,
    [exerciseId, minReps]
  );
  return row?.value ?? 0;
}

/** Trainingsdagen (met ≥1 set) in de lopende periode. */
function currentConsistency(granularity: Granularity): number {
  const fmt = periodFormat(granularity);
  const row = db.getFirstSync<{ value: number }>(
    `SELECT COUNT(DISTINCT wd.id) AS value
       FROM workout_days wd
      WHERE strftime('${fmt}', wd.date) = strftime('${fmt}', 'now', 'localtime')
        AND EXISTS (
          SELECT 1 FROM workout_exercises we
            JOIN workout_sets ws ON ws.workout_exercise_id = we.id
           WHERE we.workout_day_id = wd.id
        )`
  );
  return row?.value ?? 0;
}

/** Totaal getild volume (Σ gewicht × reps) in de lopende periode. */
function currentVolume(granularity: Granularity): number {
  const fmt = periodFormat(granularity);
  const row = db.getFirstSync<{ value: number | null }>(
    `SELECT SUM(ws.weight * ws.reps) AS value
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE strftime('${fmt}', wd.date) = strftime('${fmt}', 'now', 'localtime')`
  );
  return row?.value ?? 0;
}

function exerciseName(exerciseId: number): string | undefined {
  const row = db.getFirstSync<{ name: string }>(
    'SELECT name FROM exercises WHERE id = ?',
    [exerciseId]
  );
  return row?.name;
}

/** Bepaalt de huidige waarde voor één doel, in dezelfde eenheid als het target. */
function currentValueFor(goal: Goal): number {
  switch (goal.type) {
    case 'strength':
      return goal.exerciseId != null
        ? currentStrength(goal.exerciseId, goal.targetReps ?? 1)
        : 0;
    case 'consistency':
      return currentConsistency(goal.granularity ?? 'month');
    case 'volume':
      return currentVolume(goal.granularity ?? 'month');
  }
}

/** Eén doel met zijn huidige stand t.o.v. het target. */
export function getGoalProgress(goal: Goal): GoalProgress {
  const current = currentValueFor(goal);
  const standing = goalStanding(current, goal.targetValue);
  return {
    goal,
    exerciseName: goal.exerciseId != null ? exerciseName(goal.exerciseId) : undefined,
    current,
    target: goal.targetValue,
    pct: standing.pct,
    remaining: standing.remaining,
    reached: standing.reached,
  };
}

/** Actieve (niet-gearchiveerde) doelen met hun stand — voor de ringen. */
export function getActiveGoalsWithProgress(): GoalProgress[] {
  return getGoals(false).map(getGoalProgress);
}

/**
 * Het krachtdoel-target voor één oefening (kg), of null. Wordt gebruikt om een
 * doellijn op de kracht-grafiek te tekenen.
 */
export function getStrengthGoalTarget(exerciseId: number): number | null {
  const row = db.getFirstSync<{ target_value: number }>(
    `SELECT target_value FROM goals
      WHERE deleted = 0 AND archived = 0 AND type = 'strength' AND exercise_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 1`,
    [exerciseId]
  );
  return row?.target_value ?? null;
}
