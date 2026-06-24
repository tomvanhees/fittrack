// db/migrations.ts
//
// Versioned schema-migraties op basis van `PRAGMA user_version`. Elke migratie
// brengt het schema van versie N-1 naar N en is idempotent waar mogelijk, zodat
// bestaande installaties (die nog op user_version 0 staan) veilig bijgewerkt
// worden. Voeg een nieuwe migratie toe door SCHEMA_VERSION te verhogen en een
// entry aan `MIGRATIONS` toe te voegen — verander bestaande migraties nooit.

import type { SQLiteDatabase } from 'expo-sqlite';

/** Doelversie van het lokale schema. Verhoog dit bij elke nieuwe migratie. */
export const SCHEMA_VERSION = 5;

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
  'body_metrics',
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

/**
 * Maakt de sync-indexen + triggers voor een tabel die de sync-metadata-kolommen
 * (uuid, updated_at, version, deleted) al bezit. Idempotent dankzij IF NOT
 * EXISTS, zodat herhaald draaien veilig is. De insert-trigger vult een
 * ontbrekende uuid/updated_at aan; de update-trigger bumpt version + updated_at
 * bij een lokale wijziging, maar slaat over wanneer de sync-laag version
 * expliciet zet (NEW.version != OLD.version) — zo wint de remote-versie.
 */
function addSyncScaffolding(db: SQLiteDatabase, table: string): void {
  db.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_uuid ON ${table}(uuid)`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_${table}_updated_at ON ${table}(updated_at)`);

  db.execSync(`
    CREATE TRIGGER IF NOT EXISTS trg_${table}_insert AFTER INSERT ON ${table}
    BEGIN
      UPDATE ${table} SET
        uuid = COALESCE(NEW.uuid, (${UUID_V4})),
        updated_at = COALESCE(NEW.updated_at, datetime('now'))
      WHERE id = NEW.id;
    END;
  `);

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

// Tabellen die in migratie 3 sync-metadata kregen. Dit is een bevroren
// momentopname — bewust losgekoppeld van SYNCABLE_TABLES, dat later kan groeien
// (bv. body_metrics in migratie 5). Zo blijft migratie 3 exact hetzelfde doen
// als toen ze geschreven werd, ook op verse installaties.
const MIGRATION3_TABLES = [
  'exercises',
  'week_templates',
  'template_days',
  'template_day_exercises',
  'workout_days',
  'workout_exercises',
  'workout_sets',
] as const;

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

    // Indexen + triggers houden de metadata zelf bij, zonder dat elke query dat
    // hoeft te doen. recursive_triggers staat standaard UIT, dus de inner-UPDATE
    // in deze triggers vuurt niet opnieuw.
    addSyncScaffolding(db, table);
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

// ---------- Migratie 5: RPE, dag-notities + lichaamsmetingen ----------

function migration5(db: SQLiteDatabase): void {
  // Optionele RPE (Rate of Perceived Exertion) per set.
  if (!columnExists(db, 'workout_sets', 'rpe')) {
    db.execSync('ALTER TABLE workout_sets ADD COLUMN rpe REAL');
  }
  // Vrije notities per workout-dag.
  if (!columnExists(db, 'workout_days', 'notes')) {
    db.execSync('ALTER TABLE workout_days ADD COLUMN notes TEXT');
  }

  // Lichaamsmetingen (gewicht/vetpercentage) — syncbaar, dus mét sync-metadata.
  db.execSync(`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL UNIQUE,
      weight      REAL,
      body_fat    REAL,
      note        TEXT,
      uuid        TEXT,
      updated_at  TEXT,
      version     INTEGER NOT NULL DEFAULT 1,
      deleted     INTEGER NOT NULL DEFAULT 0
    );
  `);
  addSyncScaffolding(db, 'body_metrics');
}

const MIGRATIONS: Record<number, (db: SQLiteDatabase) => void> = {
  1: migration1,
  2: migration2,
  3: migration3,
  4: migration4,
  5: migration5,
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
