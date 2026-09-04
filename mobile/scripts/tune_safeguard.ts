/**
 * Threshold tuning harness for the confidence gate.
 *
 *   npm run tune              all 50 phrases
 *   npm run tune -- --lang es only Spanish
 *   npm run tune -- --limit 10
 *
 * Runs the real pipeline against tests/safeguard_phrases.json and prints one
 * row per phrase, so you can see where drift and self-confidence actually land
 * before choosing THRESHOLDS in src/config/safeguard.ts.
 *
 * It imports the app's own prompts and its own decision function, so the
 * numbers here come from the same pipeline the app runs. What it does NOT
 * share is the transport: the app calls through expo/fetch, this uses Node's
 * fetch. Same requests, same models, same prompts.
 *
 * Routing: prefers the proxy (EXPO_PUBLIC_API_PROXY_URL) so the numbers come
 * from the production path. Falls back to the direct dev key with a warning —
 * scores are identical either way because the proxy is a pass-through, but
 * latency will read low and the proxy's daily caps are not exercised.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DRIFT_SCORER, THRESHOLDS } from '../src/config/safeguard';
import { ENGLISH, LANGUAGES, type Language } from '../src/config/languages';
import { decide, type GateVerdict } from '../src/services/safeguardDecision';
import {
  backTranslationSystem,
  judgeSystem,
  structuredTranslationSystem,
  STRUCTURED_TRANSLATION_SCHEMA,
} from '../src/services/safeguardPrompts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

interface Phrase {
  id: number;
  lang: string;
  category: string;
  text: string;
  expect: GateVerdict;
}

/** Minimal .env reader — the app uses Expo's loader, which Node does not have. */
function readEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env: fall through to the process environment.
  }
  return { ...out, ...process.env } as Record<string, string>;
}

const env = readEnv();
const PROXY_URL = env.EXPO_PUBLIC_API_PROXY_URL?.replace(/\/$/, '');
const API_KEY = env.EXPO_PUBLIC_OPENAI_API_KEY;
const BASE_URL = PROXY_URL ? `${PROXY_URL}/v1` : 'https://api.openai.com/v1';

function headers(): Record<string, string> {
  if (PROXY_URL) {
    // The worker requires a 16–64 char hex device id; this one marks tuning runs.
    return { 'Content-Type': 'application/json', 'x-medlingua-device': 'a'.repeat(32) };
  }
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` };
}

async function chat(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('empty response');
  return content;
}

function stripFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

async function embeddingSimilarity(a: string, b: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: 'text-embedding-3-small', input: [a, b] }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data?: { embedding?: number[] }[] };
  const [va, vb] = [data.data?.[0]?.embedding, data.data?.[1]?.embedding];
  if (!va || !vb) throw new Error('malformed embeddings');
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < va.length; i += 1) {
    dot += va[i] * vb[i];
    na += va[i] * va[i];
    nb += vb[i] * vb[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

interface Row {
  phrase: Phrase;
  translation: string;
  back: string;
  drift: number | null;
  self: number | null;
  confidence: number | null;
  verdict: GateVerdict;
  flagged: string[];
  judgeReason: string;
  latencyMs: number;
  error?: string;
}

async function runPhrase(phrase: Phrase, from: Language, to: Language): Promise<Row> {
  const startedAt = Date.now();
  const base: Row = {
    phrase,
    translation: '',
    back: '',
    drift: null,
    self: null,
    confidence: null,
    verdict: 'caution',
    flagged: [],
    judgeReason: '',
    latencyMs: 0,
  };

  try {
    // Step 1 — structured translation.
    const raw = await chat({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_schema', json_schema: STRUCTURED_TRANSLATION_SCHEMA },
      messages: [
        { role: 'system', content: structuredTranslationSystem(from.englishName, to.englishName) },
        { role: 'user', content: phrase.text },
      ],
    });
    const parsed = JSON.parse(stripFences(raw)) as {
      translation: string;
      flagged_terms: { source: string; reason: string }[];
      self_confidence: number;
    };
    base.translation = parsed.translation;
    base.flagged = (parsed.flagged_terms ?? []).map((t) => t.source);
    base.self = typeof parsed.self_confidence === 'number' ? parsed.self_confidence : null;

    // Step 2 — back-translation, with no sight of the original.
    base.back = (
      await chat({
        model: 'gpt-4o',
        temperature: 0,
        messages: [
          { role: 'system', content: backTranslationSystem(to.englishName, from.englishName) },
          { role: 'user', content: base.translation },
        ],
      })
    ).trim();

    // Step 3 — drift.
    if (DRIFT_SCORER === 'embeddings') {
      base.drift = await embeddingSimilarity(phrase.text, base.back);
    } else {
      const judged = JSON.parse(
        stripFences(
          await chat({
            model: 'gpt-4o',
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: judgeSystem(from.englishName) },
              { role: 'user', content: `A: ${phrase.text}\nB: ${base.back}` },
            ],
          }),
        ),
      ) as { score?: number; reason?: string };
      base.drift = typeof judged.score === 'number' ? judged.score : null;
      base.judgeReason = judged.reason ?? '';
    }
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
  }

  // Step 4 — the app's own rule, so the table matches what the app would do.
  const outcome = decide({
    driftScore: base.drift,
    selfConfidence: base.self,
    priorBlocks: 0,
    degraded: Boolean(base.error),
  });
  base.verdict = outcome.verdict;
  base.confidence = outcome.confidence;
  base.latencyMs = Date.now() - startedAt;
  return base;
}

function pad(value: string, width: number): string {
  return value.length > width ? `${value.slice(0, width - 1)}…` : value.padEnd(width);
}

function num(value: number | null): string {
  return value == null ? '  —  ' : value.toFixed(2).padStart(5);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const langFilter = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
  const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;

  if (!PROXY_URL && !API_KEY) {
    console.error('No credentials. Set EXPO_PUBLIC_API_PROXY_URL or EXPO_PUBLIC_OPENAI_API_KEY in mobile/.env');
    process.exit(1);
  }
  if (PROXY_URL) {
    console.log(`Routing through the proxy: ${PROXY_URL}`);
  } else {
    console.warn(
      '\n! Routing DIRECT to OpenAI with the dev key — the proxy is not configured.\n' +
        '  Scores are still valid (the proxy is a pass-through to the same models),\n' +
        '  but latency will read low and the proxy daily caps are not exercised.\n' +
        '  Set EXPO_PUBLIC_API_PROXY_URL in mobile/.env to measure the production path.\n',
    );
  }

  const { phrases } = JSON.parse(
    readFileSync(join(ROOT, 'tests/safeguard_phrases.json'), 'utf8'),
  ) as { phrases: Phrase[] };

  const selected = phrases.filter((p) => !langFilter || p.lang === langFilter).slice(0, limit);
  console.log(
    `Running ${selected.length} phrases · scorer=${DRIFT_SCORER} · ` +
      `thresholds SHOW>=${THRESHOLDS.SHOW} CAUTION>=${THRESHOLDS.CAUTION}\n`,
  );

  const rows: Row[] = [];
  for (const phrase of selected) {
    const patient = phrase.lang === 'en' ? null : LANGUAGES.find((l) => l.code === phrase.lang);
    if (phrase.lang !== 'en' && !patient) {
      console.warn(`skipping ${phrase.id}: unknown language ${phrase.lang}`);
      continue;
    }
    // English is always one side: English phrases go out to Spanish as the
    // representative target; every other language comes in to English.
    const from = phrase.lang === 'en' ? ENGLISH : (patient as Language);
    const to = phrase.lang === 'en' ? (LANGUAGES.find((l) => l.code === 'es') as Language) : ENGLISH;

    const row = await runPhrase(phrase, from, to);
    rows.push(row);

    const agree = row.verdict === row.phrase.expect ? ' ' : '←';
    console.log(
      `${String(phrase.id).padStart(3)} ${pad(phrase.lang, 3)} ${pad(phrase.category, 17)} ` +
        `drift ${num(row.drift)}  self ${num(row.self)}  conf ${num(row.confidence)}  ` +
        `${pad(row.verdict, 8)} want ${pad(phrase.expect, 8)} ${agree} ${row.latencyMs}ms` +
        (row.error ? `  ERROR ${row.error}` : ''),
    );
  }

  const withScores = rows.filter((r) => r.drift != null && r.self != null);
  const agreed = rows.filter((r) => r.verdict === r.phrase.expect).length;
  const meanLatency = rows.reduce((sum, r) => sum + r.latencyMs, 0) / (rows.length || 1);
  const shouldFail = rows.filter((r) => r.phrase.category === 'designed-to-fail');
  const caught = shouldFail.filter((r) => r.verdict === 'block' || r.verdict === 'escalate').length;

  console.log(`\n${'—'.repeat(72)}`);
  console.log(`agreement with expectations : ${agreed}/${rows.length}`);
  console.log(`designed-to-fail caught     : ${caught}/${shouldFail.length}`);
  console.log(`mean latency                : ${Math.round(meanLatency)}ms (${rows.length} phrases)`);
  console.log(`errors                      : ${rows.filter((r) => r.error).length}`);

  if (withScores.length > 0) {
    const confidences = withScores
      .map((r) => r.confidence as number)
      .slice()
      .sort((a, b) => a - b);
    const at = (q: number) => confidences[Math.floor(q * (confidences.length - 1))].toFixed(2);
    console.log(
      `\nconfidence distribution: p05 ${at(0.05)}  p25 ${at(0.25)}  median ${at(0.5)}  p75 ${at(0.75)}  p95 ${at(0.95)}`,
    );
    console.log('Pick SHOW near the low end of phrases you want shown, and CAUTION above the designed-to-fail cluster.');
  }

  const csvPath = join(HERE, 'tune_results.csv');
  const header =
    'id,lang,category,expect,verdict,drift,self,confidence,latencyMs,original,translation,backTranslation,flagged,judgeReason,error';
  const csv = [
    header,
    ...rows.map((r) =>
      [
        r.phrase.id,
        r.phrase.lang,
        r.phrase.category,
        r.phrase.expect,
        r.verdict,
        r.drift ?? '',
        r.self ?? '',
        r.confidence ?? '',
        r.latencyMs,
        r.phrase.text,
        r.translation,
        r.back,
        r.flagged.join('; '),
        r.judgeReason,
        r.error ?? '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n');
  writeFileSync(csvPath, csv);
  console.log(`\nCSV written to ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
