/**
 * Gate decision log — a tuning instrument, not a product feature.
 *
 * PRIVACY CONTRACT: this writes the things the app promises never to keep —
 * what a patient said and how it was translated. It is therefore guarded twice,
 * by __DEV__ and by SAFEGUARD_LOGGING, and both must be true before a single
 * byte is written. Release builds take the early return, the bundler folds the
 * dead branch away, and the "nothing is saved" promise on the About screen and
 * in the App Store nutrition label stays literally true.
 *
 * If you ever want this in a release build, the privacy policy, the in-app
 * privacy line, and the nutrition label all have to change first.
 */

import { File, Paths } from 'expo-file-system';

import { SAFEGUARD_LOGGING } from '../config/safeguard';
import type { GateVerdict } from './safeguardDecision';

export interface GateLogRecord {
  /** ISO-8601 UTC, e.g. "2026-09-03T14:22:07.331Z". */
  at: string;
  from: string;
  to: string;
  original: string;
  translation: string;
  backTranslation: string;
  drift: number | null;
  selfConfidence: number | null;
  confidence: number | null;
  verdict: GateVerdict;
  reason: string;
  /** The judge's one-clause explanation; empty for the embeddings scorer. */
  judgeReason: string;
  flaggedTerms: string[];
  /** Which attempt at this utterance produced this record (0 = first). */
  attempt: number;
  latencyMs: number;
  scorer: string;
}

/** Bounded so a long clinic day cannot grow the file without limit. */
const MAX_RECORDS = 500;

const logFile = () => new File(Paths.cache, 'medlingua-safeguard-log.json');

/** True only in a dev build with logging switched on. */
function enabled(): boolean {
  return __DEV__ && SAFEGUARD_LOGGING;
}

export function getGateLog(): GateLogRecord[] {
  if (!enabled()) return [];
  try {
    const file = logFile();
    if (!file.exists) return [];
    return JSON.parse(file.textSync()) as GateLogRecord[];
  } catch {
    return [];
  }
}

/** Appends one decision. Never throws: logging must not break a translation. */
export function logGateDecision(record: GateLogRecord): void {
  if (!enabled()) return;
  try {
    const records = [...getGateLog(), record].slice(-MAX_RECORDS);
    const file = logFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(records, null, 2));
  } catch {
    // A tuning log is never worth interrupting an appointment for.
  }
}

export function clearGateLog(): void {
  if (!enabled()) return;
  try {
    const file = logFile();
    if (file.exists) file.delete();
  } catch {
    // Best effort.
  }
}

/** Escapes one CSV cell (quotes doubled, whole cell quoted). */
function cell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Renders records as CSV for pasting into a spreadsheet while tuning. */
export function toCSV(records: GateLogRecord[]): string {
  const headers = [
    'at',
    'from',
    'to',
    'original',
    'translation',
    'backTranslation',
    'drift',
    'selfConfidence',
    'confidence',
    'verdict',
    'reason',
    'judgeReason',
    'flaggedTerms',
    'attempt',
    'latencyMs',
    'scorer',
  ] as const;

  const rows = records.map((r) =>
    headers.map((h) => cell(h === 'flaggedTerms' ? r.flaggedTerms.join('; ') : r[h])).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}
