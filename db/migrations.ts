// db/migrations.ts
//
// Versioned schema-migraties op basis van `PRAGMA user_version`. Elke migratie
// brengt het schema van versie N-1 naar N en is idempotent waar mogelijk, zodat
// bestaande installaties (die nog op user_version 0 staan) veilig bijgewerkt
// worden. Voeg een nieuwe migratie toe door SCHEMA_VERSION te verhogen en een
// entry aan `MIGRATIONS` toe te voegen — verander bestaande migraties nooit.

import type { SQLiteDatabase } from 'expo-sqlite';

/** Doelversie van het lokale schema. Verhoog dit bij elke nieuwe migratie. */
export const SCHEMA_VERSION = 6;

/** Aantal sets dat een nieuwe template-oefening standaard krijgt. */
export const DEFAULT_TEMPLATE_SETS = 3;

/**
 * Tabellen die meegaan in cloud-sync. Ze krijgen sync-metadata (uuid,
 * updated_at, version, deleted) zodat de toekomstige Supabase-sync per rij
 * conflicten deterministisch kan oplossen. Zie docs/SYNC_PLAN.md.
 */
export const SYNCABLE_TABLES = [
  'exercises',
  'week_templates',
  'template_days',
  'template_day_exercises',
  'workout_days',
  'workout_exercises',
  'workout_sets',
  'goals',
] as const;

/**
 * Tabellen die migratie 3 van sync-metadata voorzag. Dit is een bevroren
 * momentopname: nieuwere syncbare tabellen (zoals `goals`) regelen hun eigen
 * metadata in de migratie die ze aanmaakt. Zo blijft migratie 3 deterministisch
 * en probeert ze nooit een tabel te wijzigen die op dat punt nog niet bestaat.
 */
const MIGRATION3_TABLES = [
  'exercises',
  'week_templates',
  'template_days',
  'template_day_exercises',
  'workout_days',
  'workout_exercises',
  'workout_sets',
] as const;

/**
 * SQL-expressie die een RFC-4122 v4 UUID genereert. `randomblob`/`random` zijn
 * niet-deterministisch en worden per rij opnieuw geëvalueerd, dus een enkele
 * UPDATE levert unieke waarden per rij.
 */
const UUID_V4 = `lower(
  hex(randomblob(4)) || '-' ||
  hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' ||
  substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' ||
  hex(randomblob(6))
)`;

function columnExists(db: SQLiteDatabase, table: string, column: string): boolean {
  const rows = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

// ---------- Migratie 1: basistabellen ----------

function migration1(db: SQLiteDatabase): void {
  db.execSync(`
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
      sort_order       INTEGER NOT NULL DEFAULT 0
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
      sort_order     INTEGER NOT NULL DEFAULT 0
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
}

// ---------- Migratie 2: kolommen uit eerdere app-versies ----------

function migration2(db: SQLiteDatabase): void {
  if (!columnExists(db, 'template_day_exercises', 'sets')) {
    db.execSync(
      `ALTER TABLE template_day_exercises ADD COLUMN sets INTEGER NOT NULL DEFAULT ${DEFAULT_TEMPLATE_SETS}`
    );
  }
  if (!columnExists(db, 'workout_exercises', 'planned_sets')) {
    db.execSync('ALTER TABLE workout_exercises ADD COLUMN planned_sets INTEGER');
  }
}

// ---------- Migratie 3: sync-metadata (local-first fundament) ----------

function migration3(db: SQLiteDatabase): void {
  for (const table of MIGRATION3_TABLES) {
    // Kolommen toevoegen (idempotent t.o.v. de columnExists-guard).
    if (!columnExists(db, table, 'uuid')) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN uuid TEXT`);
    }
    if (!columnExists(db, table, 'updated_at')) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
    }
    if (!columnExists(db, table, 'version')) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
    }
    if (!columnExists(db, table, 'deleted')) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`);
    }

    // Bestaande rijen een uuid + timestamp geven.
    db.execSync(`UPDATE ${table} SET uuid = (${UUID_V4}) WHERE uuid IS NULL`);
    db.execSync(`UPDATE ${table} SET updated_at = datetime('now') WHERE updated_at IS NULL`);

    db.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_uuid ON ${table}(uuid)`);
    db.execSync(
      `CREATE INDEX IF NOT EXISTS idx_${table}_updated_at ON ${table}(updated_at)`
    );

    // Triggers houden de metadata zelf bij, zonder dat elke query dat hoeft te
    // doen. recursive_triggers staat standaard UIT, dus de inner-UPDATE in deze
    // triggers vuurt niet opnieuw.
    db.execSync(`
      CREATE TRIGGER IF NOT EXISTS trg_${table}_insert AFTER INSERT ON ${table}
      BEGIN
        UPDATE ${table} SET
          uuid = COALESCE(NEW.uuid, (${UUID_V4})),
          updated_at = COALESCE(NEW.updated_at, datetime('now'))
        WHERE id = NEW.id;
      END;
    `);

    // Bij een gewone lokale wijziging (version onaangeroerd) bumpen we version
    // + updated_at. Zet de sync-laag version expliciet (NEW.version != OLD.version),
    // dan slaat de trigger over en wordt de remote-versie gerespecteerd.
    db.execSync(`
      CREATE TRIGGER IF NOT EXISTS trg_${table}_update AFTER UPDATE ON ${table}
      WHEN NEW.version = OLD.version
      BEGIN
        UPDATE ${table} SET
          version = OLD.version + 1,
          updated_at = datetime('now')
        WHERE id = NEW.id;
      END;
    `);
  }
}

// ---------- Migratie 4: sync-cursor ----------

function migration4(db: SQLiteDatabase): void {
  // Per syncbare tabel onthouden tot waar we gepusht/gepulld hebben.
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_state (
      table_name     TEXT PRIMARY KEY,
      last_pulled_at TEXT,
      last_pushed_at TEXT
    );
  `);
}

// ---------- Migratie 5: doelen (goals) ----------

function migration5(db: SQLiteDatabase): void {
  // type: 'strength' (max gewicht voor één oefening), 'consistency' (workouts
  // per periode) of 'volume' (totaal getild per periode). exercise_id is enkel
  // gevuld bij 'strength'; granularity ('month'|'year') enkel bij de
  // periode-gebonden types. De tabel draagt meteen sync-metadata zodat ze in
  // back-ups en toekomstige cloud-sync meegaat (zie SYNCABLE_TABLES).
  db.execSync(`
    CREATE TABLE IF NOT EXISTS goals (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      type          TEXT NOT NULL,
      exercise_id   INTEGER REFERENCES exercises(id),
      target_value  REAL NOT NULL,
      granularity   TEXT,
      target_date   TEXT,
      archived      INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (date('now')),
      uuid          TEXT,
      updated_at    TEXT,
      version       INTEGER NOT NULL DEFAULT 1,
      deleted       INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.execSync(`UPDATE goals SET uuid = (${UUID_V4}) WHERE uuid IS NULL`);
  db.execSync(`UPDATE goals SET updated_at = datetime('now') WHERE updated_at IS NULL`);
  db.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_uuid ON goals(uuid)`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_goals_updated_at ON goals(updated_at)`);

  // Zelfde metadata-triggers als de tabellen uit migratie 3.
  db.execSync(`
    CREATE TRIGGER IF NOT EXISTS trg_goals_insert AFTER INSERT ON goals
    BEGIN
      UPDATE goals SET
        uuid = COALESCE(NEW.uuid, (${UUID_V4})),
        updated_at = COALESCE(NEW.updated_at, datetime('now'))
      WHERE id = NEW.id;
    END;
  `);
  db.execSync(`
    CREATE TRIGGER IF NOT EXISTS trg_goals_update AFTER UPDATE ON goals
    WHEN NEW.version = OLD.version
    BEGIN
      UPDATE goals SET
        version = OLD.version + 1,
        updated_at = datetime('now')
      WHERE id = NEW.id;
    END;
  `);
}

// ---------- Migratie 6: rep-target voor krachtdoelen ----------

function migration6(db: SQLiteDatabase): void {
  // Optioneel aantal reps waarbij het krachtdoel telt (bv. "100 kg × 5").
  // Leeg = elk aantal reps, identiek aan het gedrag vóór deze migratie.
  if (!columnExists(db, 'goals', 'target_reps')) {
    db.execSync('ALTER TABLE goals ADD COLUMN target_reps INTEGER');
  }
}

const MIGRATIONS: Record<number, (db: SQLiteDatabase) => void> = {
  1: migration1,
  2: migration2,
  3: migration3,
  4: migration4,
  5: migration5,
  6: migration6,
};

/**
 * Voert alle migraties uit die nog niet zijn toegepast en zet `user_version`
 * bij naar SCHEMA_VERSION. Geeft het aantal toegepaste migraties terug.
 */
export function runMigrations(db: SQLiteDatabase): number {
  const current =
    db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;

  let applied = 0;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const migrate = MIGRATIONS[v];
    if (!migrate) continue;
    db.withTransactionSync(() => migrate(db));
    // user_version buiten de transactie zetten (schrijft enkel de db-header).
    db.execSync(`PRAGMA user_version = ${v}`);
    applied++;
  }
  return applied;
}

/** Huidige schemaversie van de geopende database. */
export function getSchemaVersion(db: SQLiteDatabase): number {
  return db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
}
