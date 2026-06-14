// lib/backup.ts
//
// Exporteert alle lokale data naar één JSON-bestand en biedt het via het
// systeem-deelvenster aan. Het bestand draagt een schema- én app-versie zodat
// een oudere export later veilig geïmporteerd/gemigreerd kan worden.

import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '@/db/schema';
import { getSchemaVersion, SYNCABLE_TABLES } from '@/db/migrations';

export const BACKUP_FORMAT = 'fittrack-backup';

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string; // ISO-timestamp
  tables: Record<string, Record<string, unknown>[]>;
}

/** Leest elke syncbare tabel volledig uit (incl. sync-metadata kolommen). */
export function buildBackup(): BackupFile {
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const table of SYNCABLE_TABLES) {
    tables[table] = db.getAllSync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }

  return {
    format: BACKUP_FORMAT,
    schemaVersion: getSchemaVersion(db),
    appVersion: Constants.expoConfig?.version ?? 'onbekend',
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export interface ExportResult {
  /** false wanneer het toestel geen deelvenster ondersteunt (bv. web). */
  shared: boolean;
  uri: string;
  rowCount: number;
}

/**
 * Schrijft de back-up naar de cache-map en opent het deelvenster. Geeft het
 * pad + aantal geëxporteerde rijen terug.
 */
export async function exportData(): Promise<ExportResult> {
  const backup = buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const rowCount = Object.values(backup.tables).reduce((sum, rows) => sum + rows.length, 0);

  const stamp = backup.exportedAt.slice(0, 10); // YYYY-MM-DD
  const file = new File(Paths.cache, `fittrack-backup-${stamp}.json`);
  file.create({ overwrite: true });
  file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'FitTrack back-up exporteren',
      UTI: 'public.json',
    });
  }

  return { shared: canShare, uri: file.uri, rowCount };
}
