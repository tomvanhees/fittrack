// db/queries/templates.ts

import { db, DEFAULT_TEMPLATE_SETS } from '../schema';
import { getExerciseById } from './exercises';
import { getOrCreateWorkoutDay, getWorkoutExercises } from './workouts';
import { weekDatesOf } from '@/lib/date';
import type {
  TemplateDay,
  TemplateDayExercise,
  TemplateDayWithExercises,
  TemplateWithDays,
  WeekTemplate,
} from '@/types';

// ---------- Row types ----------

interface TemplateRow {
  id: number;
  name: string;
  created_at: string;
}

interface TemplateDayRow {
  id: number;
  template_id: number;
  weekday: number;
  label: string | null;
}

interface TemplateDayExerciseRow {
  id: number;
  template_day_id: number;
  exercise_id: number;
  sort_order: number;
  sets: number;
}

function mapTemplate(row: TemplateRow): WeekTemplate {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function mapDay(row: TemplateDayRow): TemplateDay {
  return {
    id: row.id,
    templateId: row.template_id,
    weekday: row.weekday,
    label: row.label ?? undefined,
  };
}

// ---------- Templates ----------

export interface TemplateSummary extends WeekTemplate {
  weekdays: number[]; // gesorteerde weekdag-indices met oefeningen
  dayCount: number;
}

export function getAllTemplates(): TemplateSummary[] {
  const templates = db
    .getAllSync<TemplateRow>(
      'SELECT * FROM week_templates WHERE deleted = 0 ORDER BY created_at DESC, id DESC'
    )
    .map(mapTemplate);

  return templates.map((t) => {
    const days = db.getAllSync<{ weekday: number }>(
      `SELECT DISTINCT td.weekday AS weekday
         FROM template_days td
        WHERE td.template_id = ?
          AND td.deleted = 0
          AND EXISTS (
            SELECT 1 FROM template_day_exercises tde
             WHERE tde.template_day_id = td.id AND tde.deleted = 0
          )
        ORDER BY (td.weekday + 6) % 7 ASC`,
      [t.id]
    );
    const weekdays = days.map((d) => d.weekday);
    return { ...t, weekdays, dayCount: weekdays.length };
  });
}

export function createTemplate(name: string): WeekTemplate {
  const result = db.runSync('INSERT INTO week_templates (name) VALUES (?)', [name.trim()]);
  return db
    .getAllSync<TemplateRow>('SELECT * FROM week_templates WHERE id = ?', [
      result.lastInsertRowId,
    ])
    .map(mapTemplate)[0];
}

export function updateTemplateName(id: number, name: string): void {
  db.runSync('UPDATE week_templates SET name = ? WHERE id = ?', [name.trim(), id]);
}

export function deleteTemplate(id: number): void {
  // Soft-delete het sjabloon én zijn dagen + dag-oefeningen (tombstones).
  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE template_day_exercises SET deleted = 1
        WHERE deleted = 0 AND template_day_id IN (
          SELECT id FROM template_days WHERE template_id = ?
        )`,
      [id]
    );
    db.runSync('UPDATE template_days SET deleted = 1 WHERE template_id = ? AND deleted = 0', [id]);
    db.runSync('UPDATE week_templates SET deleted = 1 WHERE id = ?', [id]);
  });
}

export function getTemplateWithDays(id: number): TemplateWithDays | null {
  const row = db.getFirstSync<TemplateRow>(
    'SELECT * FROM week_templates WHERE id = ? AND deleted = 0',
    [id]
  );
  if (!row) return null;

  const dayRows = db.getAllSync<TemplateDayRow>(
    'SELECT * FROM template_days WHERE template_id = ? AND deleted = 0 ORDER BY (weekday + 6) % 7 ASC',
    [id]
  );

  const days: TemplateDayWithExercises[] = dayRows.map((dr) => {
    const day = mapDay(dr);
    const exRows = db.getAllSync<TemplateDayExerciseRow>(
      'SELECT * FROM template_day_exercises WHERE template_day_id = ? AND deleted = 0 ORDER BY sort_order ASC, id ASC',
      [dr.id]
    );
    const exercises = exRows
      .map((er) => {
        const exercise = getExerciseById(er.exercise_id);
        if (!exercise) return null;
        return {
          id: er.id,
          templateDayId: er.template_day_id,
          exerciseId: er.exercise_id,
          order: er.sort_order,
          sets: er.sets,
          exercise,
        } satisfies TemplateDayExercise & { exercise: typeof exercise };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return { ...day, exercises };
  });

  return { ...mapTemplate(row), days };
}

// ---------- Template days ----------

export function getOrCreateTemplateDay(templateId: number, weekday: number): TemplateDay {
  const existing = db.getFirstSync<TemplateDayRow>(
    'SELECT * FROM template_days WHERE template_id = ? AND weekday = ? AND deleted = 0',
    [templateId, weekday]
  );
  if (existing) return mapDay(existing);

  // Een eerder soft-deleted dag voor deze weekdag nieuw leven inblazen i.p.v.
  // een duplicaat aanmaken.
  const tomb = db.getFirstSync<TemplateDayRow>(
    'SELECT * FROM template_days WHERE template_id = ? AND weekday = ? AND deleted = 1',
    [templateId, weekday]
  );
  if (tomb) {
    db.runSync('UPDATE template_days SET deleted = 0 WHERE id = ?', [tomb.id]);
    return mapDay({ ...tomb, label: tomb.label });
  }

  const result = db.runSync(
    'INSERT INTO template_days (template_id, weekday) VALUES (?, ?)',
    [templateId, weekday]
  );
  return {
    id: result.lastInsertRowId,
    templateId,
    weekday,
    label: undefined,
  };
}

export function setTemplateDayLabel(templateDayId: number, label: string): void {
  const trimmed = label.trim();
  db.runSync('UPDATE template_days SET label = ? WHERE id = ?', [
    trimmed.length > 0 ? trimmed : null,
    templateDayId,
  ]);
}

export function deleteTemplateDay(templateDayId: number): void {
  db.withTransactionSync(() => {
    db.runSync(
      'UPDATE template_day_exercises SET deleted = 1 WHERE template_day_id = ? AND deleted = 0',
      [templateDayId]
    );
    db.runSync('UPDATE template_days SET deleted = 1 WHERE id = ?', [templateDayId]);
  });
}

// ---------- Template day exercises ----------

export function addTemplateDayExercise(
  templateDayId: number,
  exerciseId: number
): void {
  const next = db.getFirstSync<{ next: number }>(
    'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM template_day_exercises WHERE template_day_id = ?',
    [templateDayId]
  );
  db.runSync(
    'INSERT INTO template_day_exercises (template_day_id, exercise_id, sort_order, sets) VALUES (?, ?, ?, ?)',
    [templateDayId, exerciseId, next?.next ?? 0, DEFAULT_TEMPLATE_SETS]
  );
}

/** Werkt het geplande aantal sets van een template-oefening bij (1..9). */
export function updateTemplateDayExerciseSets(
  templateDayExerciseId: number,
  sets: number
): void {
  const clamped = Math.max(1, Math.min(9, Math.round(sets)));
  db.runSync('UPDATE template_day_exercises SET sets = ? WHERE id = ?', [
    clamped,
    templateDayExerciseId,
  ]);
}

export function removeTemplateDayExercise(templateDayExerciseId: number): void {
  db.runSync('UPDATE template_day_exercises SET deleted = 1 WHERE id = ?', [templateDayExerciseId]);
}

// ---------- Apply template ----------

/**
 * Past een template toe op de week waarin `targetDate` valt. Kopieert per
 * template-dag de oefeningen naar de corresponderende weekdag en koppelt
 * `template_day_id` voor traceerbaarheid. Bestaande oefeningen van die dagen
 * worden overschreven.
 */
export function applyTemplateToWeek(templateId: number, targetDate: string): void {
  const template = getTemplateWithDays(templateId);
  if (!template) return;

  const weekDates = weekDatesOf(targetDate); // ma..zo

  db.withTransactionSync(() => {
    for (const tDay of template.days) {
      // weekDates is ma..zo (index 0..6); weekday is 0=zo..6=za.
      const dateIndex = (tDay.weekday + 6) % 7;
      const date = weekDates[dateIndex];
      const day = getOrCreateWorkoutDay(date);

      // Bestaande oefeningen van die dag wissen (soft-delete incl. hun sets).
      const existing = getWorkoutExercises(day.id);
      for (const we of existing) {
        db.runSync(
          'UPDATE workout_sets SET deleted = 1 WHERE workout_exercise_id = ? AND deleted = 0',
          [we.id]
        );
        db.runSync('UPDATE workout_exercises SET deleted = 1 WHERE id = ?', [we.id]);
      }

      // Koppel de template-dag.
      db.runSync('UPDATE workout_days SET template_day_id = ?, is_rest_day = 0 WHERE id = ?', [
        tDay.id,
        day.id,
      ]);

      // Kopieer oefeningen, inclusief het geplande aantal sets.
      for (const ex of tDay.exercises) {
        db.runSync(
          'INSERT INTO workout_exercises (workout_day_id, exercise_id, sort_order, planned_sets) VALUES (?, ?, ?, ?)',
          [day.id, ex.exerciseId, ex.order, ex.sets]
        );
      }
    }
  });
}

export function weekHasExercises(targetDate: string): boolean {
  const weekDates = weekDatesOf(targetDate);
  const placeholders = weekDates.map(() => '?').join(', ');
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) AS count
       FROM workout_exercises we
       JOIN workout_days wd ON wd.id = we.workout_day_id
      WHERE wd.date IN (${placeholders}) AND we.deleted = 0`,
    weekDates
  );
  return (row?.count ?? 0) > 0;
}
