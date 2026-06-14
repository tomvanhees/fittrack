// db/schema.ts

import * as SQLite from 'expo-sqlite';
import { DEFAULT_TEMPLATE_SETS, runMigrations } from './migrations';
import { seedDefaultExercises } from './seed';

export const db = SQLite.openDatabaseSync('fittrack.db');

// Her-export zodat bestaande imports (`from '../schema'`) blijven werken.
export { DEFAULT_TEMPLATE_SETS };

export function initDatabase() {
  // PRAGMA's staan los van de migraties (connectie-instellingen).
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Versiegestuurde migraties (PRAGMA user_version). Zie db/migrations.ts.
  runMigrations(db);

  // Seed standaard oefeningen — voegt enkel ontbrekende namen toe.
  seedDefaultExercises();
}
