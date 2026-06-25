// db/queries/bodyMetrics.ts
//
// CRUD voor lichaamsmetingen (gewicht/vetpercentage per dag). Eén rij per
// datum (uniek), met dezelfde soft-delete + sync-metadata als de rest van de
// app. De triggers vullen uuid/updated_at/version automatisch aan.

import { db } from '../schema';
import type { BodyMetric } from '@/types';

interface BodyMetricRow {
  id: number;
  date: string;
  weight: number | null;
  body_fat: number | null;
  note: string | null;
}

function mapMetric(row: BodyMetricRow): BodyMetric {
  return {
    id: row.id,
    date: row.date,
    weight: row.weight ?? 0,
    bodyFat: row.body_fat ?? undefined,
    note: row.note ?? undefined,
  };
}

export interface BodyMetricInput {
  weight: number;
  bodyFat?: number | null;
  note?: string | null;
}

/** Voegt de meting van een dag toe of werkt ze bij (uniek per datum). */
export function upsertBodyMetric(date: string, values: BodyMetricInput): BodyMetric {
  const bodyFat = values.bodyFat ?? null;
  const note = values.note?.trim() ? values.note.trim() : null;
  const existing = db.getFirstSync<{ id: number }>(
    'SELECT id FROM body_metrics WHERE date = ?',
    [date]
  );
  if (existing) {
    db.runSync(
      'UPDATE body_metrics SET weight = ?, body_fat = ?, note = ?, deleted = 0 WHERE id = ?',
      [values.weight, bodyFat, note, existing.id]
    );
    return getBodyMetricByDate(date)!;
  }
  const result = db.runSync(
    'INSERT INTO body_metrics (date, weight, body_fat, note) VALUES (?, ?, ?, ?)',
    [date, values.weight, bodyFat, note]
  );
  return db
    .getAllSync<BodyMetricRow>('SELECT * FROM body_metrics WHERE id = ?', [result.lastInsertRowId])
    .map(mapMetric)[0];
}

export function getBodyMetricByDate(date: string): BodyMetric | null {
  const row = db.getFirstSync<BodyMetricRow>(
    'SELECT * FROM body_metrics WHERE date = ? AND deleted = 0',
    [date]
  );
  return row ? mapMetric(row) : null;
}

/** Alle metingen (oplopend in tijd), eventueel vanaf `sinceISO` (incl.). */
export function listBodyMetrics(sinceISO?: string): BodyMetric[] {
  const rows = sinceISO
    ? db.getAllSync<BodyMetricRow>(
        'SELECT * FROM body_metrics WHERE deleted = 0 AND date >= ? ORDER BY date ASC',
        [sinceISO]
      )
    : db.getAllSync<BodyMetricRow>(
        'SELECT * FROM body_metrics WHERE deleted = 0 ORDER BY date ASC'
      );
  return rows.map(mapMetric);
}

/** Meest recente meting, of null als er nog niets is. */
export function getLatestBodyMetric(): BodyMetric | null {
  const row = db.getFirstSync<BodyMetricRow>(
    'SELECT * FROM body_metrics WHERE deleted = 0 ORDER BY date DESC LIMIT 1'
  );
  return row ? mapMetric(row) : null;
}

/** Soft-delete van de meting op een datum (syncbaar als tombstone). */
export function deleteBodyMetric(date: string): void {
  db.runSync('UPDATE body_metrics SET deleted = 1 WHERE date = ?', [date]);
}
