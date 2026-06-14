// db/sync/state.ts
//
// Lees/schrijf de sync-cursors per tabel (sync_state, migratie 4).

import { db } from '@/db/schema';

export interface SyncCursor {
  lastPulledAt: string | null;
  lastPushedAt: string | null;
}

export function getCursor(table: string): SyncCursor {
  const row = db.getFirstSync<{ last_pulled_at: string | null; last_pushed_at: string | null }>(
    'SELECT last_pulled_at, last_pushed_at FROM sync_state WHERE table_name = ?',
    [table]
  );
  return {
    lastPulledAt: row?.last_pulled_at ?? null,
    lastPushedAt: row?.last_pushed_at ?? null,
  };
}

export function setPulledAt(table: string, value: string): void {
  db.runSync(
    `INSERT INTO sync_state (table_name, last_pulled_at) VALUES (?, ?)
       ON CONFLICT(table_name) DO UPDATE SET last_pulled_at = excluded.last_pulled_at`,
    [table, value]
  );
}

export function setPushedAt(table: string, value: string): void {
  db.runSync(
    `INSERT INTO sync_state (table_name, last_pushed_at) VALUES (?, ?)
       ON CONFLICT(table_name) DO UPDATE SET last_pushed_at = excluded.last_pushed_at`,
    [table, value]
  );
}

/** Wist alle cursors — bv. bij uitloggen, zodat een volgende login vers pullt. */
export function resetCursors(): void {
  db.runSync('DELETE FROM sync_state');
}
