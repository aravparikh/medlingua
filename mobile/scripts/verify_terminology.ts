/**
 * Terminology verification — build-time, not runtime.
 *
 *   npm run verify:terms
 *
 * Checks the app's clinical vocabulary against the U.S. National Library of
 * Medicine and writes the result to src/config/terminology.json, which is
 * checked in so anyone can audit it without running anything.
 *
 * Two sources, because they answer different questions:
 *
 *   RxNorm (rxnav.nlm.nih.gov) — the NLM's normalized drug vocabulary, and a
 *     source vocabulary of the UMLS Metathesaurus. Public, no key, no licence.
 *     Every name in config/medications.ts must resolve to an RXCUI.
 *
 *   UMLS Metathesaurus (uts-ws.nlm.nih.gov) — for anatomy and symptom concepts
 *     that are not drugs. Needs a free UTS account and an API key in
 *     UMLS_API_KEY; this step is skipped with a notice when the key is absent,
 *     so the drug half always runs.
 *
 * Nothing here ships in the app. The app makes no terminology calls at
 * runtime: it reads the committed JSON, or nothing at all.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MEDICATION_ROSTER } from '../src/config/medications';
import { BODY_REGIONS } from '../src/config/bodyRegions';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const RXNAV = 'https://rxnav.nlm.nih.gov/REST';
const UTS = 'https://uts-ws.nlm.nih.gov/rest';

function readEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* fall through to process env */
  }
  return { ...out, ...process.env } as Record<string, string>;
}

interface DrugEntry {
  term: string;
  rxcui: string | null;
  rxnormName: string | null;
  /** Whether RxNorm considers this an exact match rather than a spelling suggestion. */
  exact: boolean;
}

interface ConceptEntry {
  term: string;
  cui: string | null;
  preferredName: string | null;
  rootSource: string | null;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Resolves one drug name to an RxNorm concept unique identifier. */
async function verifyDrug(term: string): Promise<DrugEntry> {
  // search=0 is an exact-name lookup; no fuzzy fallback, so a pass means the
  // spelling in our roster is the spelling RxNorm recognises.
  const exactHit = await getJson(`${RXNAV}/rxcui.json?name=${encodeURIComponent(term)}&search=0`);
  const rxcui: string | undefined = exactHit?.idGroup?.rxnormId?.[0];
  if (!rxcui) return { term, rxcui: null, rxnormName: null, exact: false };

  const props = await getJson(`${RXNAV}/rxcui/${rxcui}/properties.json`);
  return {
    term,
    rxcui,
    rxnormName: props?.properties?.name ?? null,
    exact: true,
  };
}

/** Resolves one clinical term to a UMLS concept. Requires a UTS API key. */
async function verifyConcept(term: string, apiKey: string): Promise<ConceptEntry> {
  const url =
    `${UTS}/search/current?string=${encodeURIComponent(term)}` +
    `&searchType=exact&pageSize=1&apiKey=${encodeURIComponent(apiKey)}`;
  const data = await getJson(url);
  const hit = data?.result?.results?.[0];
  if (!hit || hit.ui === 'NONE') return { term, cui: null, preferredName: null, rootSource: null };
  return {
    term,
    cui: hit.ui ?? null,
    preferredName: hit.name ?? null,
    rootSource: hit.rootSource ?? null,
  };
}

async function main(): Promise<void> {
  const env = readEnv();
  const umlsKey = env.UMLS_API_KEY;

  console.log(`Verifying ${MEDICATION_ROSTER.length} medications against RxNorm (NLM)…\n`);
  const drugs: DrugEntry[] = [];
  for (const term of MEDICATION_ROSTER) {
    try {
      const entry = await verifyDrug(term);
      drugs.push(entry);
      console.log(
        entry.rxcui
          ? `  ok    ${term.padEnd(22)} RXCUI ${entry.rxcui.padEnd(8)} ${entry.rxnormName ?? ''}`
          : `  MISS  ${term.padEnd(22)} no exact RxNorm concept`,
      );
    } catch (err) {
      drugs.push({ term, rxcui: null, rxnormName: null, exact: false });
      console.log(`  ERROR ${term.padEnd(22)} ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Body-region names are anatomy concepts, not drugs — UMLS, not RxNorm.
  const regionTerms = Object.values(BODY_REGIONS).map((r) => r.name.en);
  let concepts: ConceptEntry[] = [];
  if (umlsKey) {
    console.log(`\nVerifying ${regionTerms.length} anatomy terms against the UMLS Metathesaurus…\n`);
    for (const term of regionTerms) {
      try {
        const entry = await verifyConcept(term, umlsKey);
        concepts.push(entry);
        console.log(
          entry.cui
            ? `  ok    ${term.padEnd(22)} CUI ${entry.cui.padEnd(10)} ${entry.preferredName ?? ''}`
            : `  MISS  ${term.padEnd(22)} no exact UMLS concept`,
        );
      } catch (err) {
        concepts.push({ term, cui: null, preferredName: null, rootSource: null });
        console.log(`  ERROR ${term.padEnd(22)} ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else {
    console.log(
      '\nSkipping the UMLS step: no UMLS_API_KEY in mobile/.env.\n' +
        '  Get a free UTS account at https://uts.nlm.nih.gov/uts/signup-login,\n' +
        '  then add UMLS_API_KEY=... and re-run. The RxNorm results above stand\n' +
        '  on their own — RxNorm is an NLM vocabulary and needs no licence.\n',
    );
  }

  const resolvedDrugs = drugs.filter((d) => d.rxcui).length;
  const resolvedConcepts = concepts.filter((c) => c.cui).length;

  const output = {
    _comment:
      'Generated by scripts/verify_terminology.ts. Build-time verification of the ' +
      'app clinical vocabulary against the U.S. National Library of Medicine. The app ' +
      'makes no terminology API calls at runtime.',
    generatedAt: new Date().toISOString(),
    sources: {
      rxnorm: { api: `${RXNAV}/rxcui`, licence: 'public, no key required' },
      umls: { api: `${UTS}/search/current`, licence: 'free UTS account required' },
    },
    medications: { checked: drugs.length, resolved: resolvedDrugs, entries: drugs },
    anatomy: umlsKey
      ? { checked: concepts.length, resolved: resolvedConcepts, entries: concepts }
      : { checked: 0, resolved: 0, entries: [], skipped: 'no UMLS_API_KEY' },
  };

  const outPath = join(ROOT, 'src/config/terminology.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`\n${'—'.repeat(60)}`);
  console.log(`medications resolved : ${resolvedDrugs}/${drugs.length}`);
  if (umlsKey) console.log(`anatomy resolved     : ${resolvedConcepts}/${concepts.length}`);
  console.log(`written to           : ${outPath}`);

  if (resolvedDrugs < drugs.length) {
    console.error('\nSome medications did not resolve. Fix the spelling in src/config/medications.ts.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
