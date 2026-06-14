// db/schema.ts

import * as SQLite from 'expo-sqlite';
import { seedDefaultExercises } from './seed';

export const db = SQLite.openDatabaseSync('fittrack.db');

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'custom',
      is_custom   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS week_templates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS template_days (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES week_templates(id) ON DELETE CASCADE,
      weekday     INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6),
      label       TEXT
    );

    CREATE TABLE IF NOT EXISTS template_day_exercises (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      template_day_id  INTEGER NOT NULL REFERENCES template_days(id) ON DELETE CASCADE,
      exercise_id      INTEGER NOT NULL REFERENCES exercises(id),
      sort_order       INTEGER NOT NULL DEFAULT 0,
      sets             INTEGER NOT NULL DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS workout_days (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      date             TEXT NOT NULL UNIQUE,
      template_day_id  INTEGER REFERENCES template_days(id),
      is_rest_day      INTEGER NOT NULL DEFAULT 0,
      completed_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_day_id INTEGER NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
      exercise_id    INTEGER NOT NULL REFERENCES exercises(id),
      sort_order     INTEGER NOT NULL DEFAULT 0,
      planned_sets   INTEGER
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_number          INTEGER NOT NULL,
      weight              REAL NOT NULL DEFAULT 0,
      reps                INTEGER NOT NULL DEFAULT 0,
      completed_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migraties voor bestaande databases (nieuwe kolommen).
  migrate();

  // Seed standaard oefeningen — alleen bij de allereerste run.
  seedDefaultExercises();
}

/** Aantal sets dat een nieuwe template-oefening standaard krijgt. */
export const DEFAULT_TEMPLATE_SETS = 3;

function columnExists(table: string, column: string): boolean {
  const rows = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

/** Voegt kolommen toe die in latere versies zijn bijgekomen. Idempotent. */
function migrate(): void {
  if (!columnExists('template_day_exercises', 'sets')) {
    db.execSync(
      `ALTER TABLE template_day_exercises ADD COLUMN sets INTEGER NOT NULL DEFAULT ${DEFAULT_TEMPLATE_SETS}`
    );
  }
  if (!columnExists('workout_exercises', 'planned_sets')) {
    db.execSync('ALTER TABLE workout_exercises ADD COLUMN planned_sets INTEGER');
  }
}
