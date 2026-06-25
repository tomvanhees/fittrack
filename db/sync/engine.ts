// db/sync/engine.ts
//
// Bidirectionele sync tussen de lokale SQLite-database en Supabase.
//
// Model (zie docs/SYNC_PLAN.md):
//   * Globale sleutel = `uuid`. Relaties verwijzen remote naar `<parent>_uuid`;
//     lokaal naar de int-id van de ouder. mapToRemote/applyRemote vertalen heen
//     en weer.
//   * "Dirty" = lokale rijen met `updated_at > last_pushed_at`. Verwijderingen
//     zijn tombstones (`deleted = 1`) en syncen mee als gewone wijziging.
//   * Conflict: hoogste `version` wint, dan nieuwste `updated_at`. We passen een
//     remote-rij enkel toe als die "nieuwer" is; bij toepassen zetten we
//     `version` expliciet zodat de lokale trigger géén nieuwe versie maakt.
//
// Beperkingen v1: client-timestamps (geen server-autoritatieve klok), dus bij
// grote klokafwijking tussen toestellen kan LWW suboptimaal kiezen. Upserts
// zijn idempotent, dus dit veroorzaakt hooguit wat extra verkeer, geen
// dataverlies-loops.

import { supabase } from './client';
import { getCursor, setPulledAt, setPushedAt } from './state';
import { db } from '@/db/schema';

interface ForeignKey {
  local: string; // lokale FK-kolom (int id)
  remote: string; // remote FK-kolom (parent uuid)
  parent: string; // parent-tabelnaam
}

interface SyncTable {
  table: string;
  /** Gewone datakolommen (lokale namen) die 1:1 mappen. */
  columns: string[];
  /** Kolommen die lokaal 0/1 zijn maar remote boolean. */
  bools: string[];
  fks: ForeignKey[];
}

// Volgorde = FK-afhankelijkheid (ouders eerst). Belangrijk voor push én pull.
const SYNC_TABLES: SyncTable[] = [
  { table: 'exercises', columns: ['name', 'category'], bools: ['is_custom'], fks: [] },
  { table: 'week_templates', columns: ['name', 'created_at'], bools: [], fks: [] },
  {
    table: 'template_days',
    columns: ['weekday', 'label'],
    bools: [],
    fks: [{ local: 'template_id', remote: 'template_uuid', parent: 'week_templates' }],
  },
  {
    table: 'template_day_exercises',
    columns: ['sort_order', 'sets'],
    bools: [],
    fks: [
      { local: 'template_day_id', remote: 'template_day_uuid', parent: 'template_days' },
      { local: 'exercise_id', remote: 'exercise_uuid', parent: 'exercises' },
    ],
  },
  {
    table: 'workout_days',
    columns: ['date', 'completed_at', 'notes'],
    bools: ['is_rest_day'],
    fks: [{ local: 'template_day_id', remote: 'template_day_uuid', parent: 'template_days' }],
  },
  {
    table: 'workout_exercises',
    columns: ['sort_order', 'planned_sets'],
    bools: [],
    fks: [
      { local: 'workout_day_id', remote: 'workout_day_uuid', parent: 'workout_days' },
      { local: 'exercise_id', remote: 'exercise_uuid', parent: 'exercises' },
    ],
  },
  {
    table: 'workout_sets',
    columns: ['set_number', 'weight', 'reps', 'rpe', 'completed_at'],
    bools: [],
    fks: [
      {
        local: 'workout_exercise_id',
        remote: 'workout_exercise_uuid',
        parent: 'workout_exercises',
      },
    ],
  },
  // Lichaamsmetingen — geen FK's; syncen op uuid net als de rest.
  {
    table: 'body_metrics',
    columns: ['date', 'weight', 'body_fat', 'note'],
    bools: [],
    fks: [],
  },
];

type Row = Record<string, unknown>;

/** Remote ISO-timestamp → lokaal "YYYY-MM-DD HH:MM:SS" (UTC), zodat lokale
 *  string-vergelijking van updated_at consistent blijft. */
function toLocalTs(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

function uuidForLocalId(parent: string, localId: unknown): string | null {
  if (localId === null || localId === undefined) return null;
  const row = db.getFirstSync<{ uuid: string }>(
    `SELECT uuid FROM ${parent} WHERE id = ?`,
    [localId as number]
  );
  return row?.uuid ?? null;
}

function localIdForUuid(parent: string, uuid: unknown): number | null {
  if (uuid === null || uuid === undefined) return null;
  const row = db.getFirstSync<{ id: number }>(
    `SELECT id FROM ${parent} WHERE uuid = ?`,
    [uuid as string]
  );
  return row?.id ?? null;
}

// ───────────────────────────── Push ─────────────────────────────

function mapToRemote(t: SyncTable, row: Row, userId: string): Row {
  const out: Row = {
    uuid: row.uuid,
    user_id: userId,
    version: row.version,
    deleted: !!row.deleted,
    updated_at: row.updated_at,
  };
  for (const col of t.columns) out[col] = row[col];
  for (const col of t.bools) out[col] = !!row[col];
  for (const fk of t.fks) out[fk.remote] = uuidForLocalId(fk.parent, row[fk.local]);
  return out;
}

async function pushTable(t: SyncTable, userId: string): Promise<void> {
  if (!supabase) return;
  const { lastPushedAt } = getCursor(t.table);

  const rows = db.getAllSync<Row>(
    `SELECT * FROM ${t.table} WHERE ? IS NULL OR updated_at > ?`,
    [lastPushedAt, lastPushedAt]
  );
  if (rows.length === 0) return;

  const payload = rows.map((r) => mapToRemote(t, r, userId));
  const { error } = await supabase.from(t.table).upsert(payload, { onConflict: 'uuid' });
  if (error) throw new Error(`push ${t.table}: ${error.message}`);

  const maxUpdated = rows.reduce(
    (max, r) => (String(r.updated_at) > max ? String(r.updated_at) : max),
    lastPushedAt ?? ''
  );
  if (maxUpdated) setPushedAt(t.table, maxUpdated);
}

// ───────────────────────────── Pull ─────────────────────────────

function applyRemote(t: SyncTable, remote: Row): void {
  // FK-uuids → lokale parent-id's. Ontbreekt een verplichte ouder lokaal nog,
  // dan slaan we de rij over (ouders komen eerst in de pull-volgorde).
  const fkValues: Record<string, number | null> = {};
  for (const fk of t.fks) {
    const localId = localIdForUuid(fk.parent, remote[fk.remote]);
    if (localId === null && remote[fk.remote] != null) return; // ouder ontbreekt
    fkValues[fk.local] = localId;
  }

  const updatedAtLocal = toLocalTs(String(remote.updated_at));
  const deleted = remote.deleted ? 1 : 0;
  const version = Number(remote.version ?? 1);

  const dataCols = [...t.columns];
  const dataVals: (string | number | null)[] = t.columns.map(
    (c) => (remote[c] ?? null) as string | number | null
  );
  for (const col of t.bools) {
    dataCols.push(col);
    dataVals.push(remote[col] ? 1 : 0);
  }
  for (const fk of t.fks) {
    dataCols.push(fk.local);
    dataVals.push(fkValues[fk.local]);
  }

  const existing = db.getFirstSync<{ id: number; version: number; updated_at: string }>(
    `SELECT id, version, updated_at FROM ${t.table} WHERE uuid = ?`,
    [remote.uuid as string]
  );

  if (existing) {
    // Conflict: hoogste version wint, dan nieuwste updated_at.
    const remoteWins =
      version > existing.version ||
      (version === existing.version && updatedAtLocal > existing.updated_at);
    if (!remoteWins) return;

    const setClause = [...dataCols.map((c) => `${c} = ?`), 'version = ?', 'deleted = ?', 'updated_at = ?'];
    db.runSync(`UPDATE ${t.table} SET ${setClause.join(', ')} WHERE uuid = ?`, [
      ...dataVals,
      version,
      deleted,
      updatedAtLocal,
      remote.uuid as string,
    ]);
  } else {
    const cols = ['uuid', ...dataCols, 'version', 'deleted', 'updated_at'];
    const placeholders = cols.map(() => '?').join(', ');
    db.runSync(`INSERT INTO ${t.table} (${cols.join(', ')}) VALUES (${placeholders})`, [
      remote.uuid as string,
      ...dataVals,
      version,
      deleted,
      updatedAtLocal,
    ]);
  }
}

async function pullTable(t: SyncTable): Promise<void> {
  if (!supabase) return;
  const { lastPulledAt } = getCursor(t.table);

  let query = supabase.from(t.table).select('*').order('updated_at', { ascending: true });
  if (lastPulledAt) query = query.gt('updated_at', lastPulledAt);

  const { data, error } = await query;
  if (error) throw new Error(`pull ${t.table}: ${error.message}`);
  if (!data || data.length === 0) return;

  db.withTransactionSync(() => {
    for (const row of data) applyRemote(t, row as Row);
  });

  // Cursor = hoogste remote updated_at (ruwe ISO; Postgres vergelijkt als tijd).
  const maxRemote = data.reduce(
    (max, r) => (String((r as Row).updated_at) > max ? String((r as Row).updated_at) : max),
    lastPulledAt ?? ''
  );
  if (maxRemote) setPulledAt(t.table, maxRemote);

  // Voorkom dat zojuist gepullde rijen meteen terug-gepusht worden.
  const localMax = db.getFirstSync<{ m: string | null }>(
    `SELECT MAX(updated_at) AS m FROM ${t.table}`
  );
  if (localMax?.m) setPushedAt(t.table, localMax.m);
}

// ───────────────────────────── Orchestratie ─────────────────────────────

/**
 * Volledige sync: eerst alle tabellen pushen (ouders→kinderen), dan alle
 * pullen. Gooit bij de eerste fout zodat de UI die kan tonen.
 */
export async function syncAll(): Promise<void> {
  if (!supabase) throw new Error('Supabase is niet geconfigureerd.');
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error('Niet aangemeld.');

  for (const t of SYNC_TABLES) await pushTable(t, userId);
  for (const t of SYNC_TABLES) await pullTable(t);
}
