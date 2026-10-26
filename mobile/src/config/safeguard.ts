/**
 * Translation confidence gate — every tunable in one file.
 *
 * The gate re-checks each machine translation before the patient or clinician
 * is allowed to see it: the model reports its own confidence, the translation
 * is translated back without sight of the original, and the two are compared.
 * A translation that survives is shown; one that doesn't is withheld and the
 * speaker is asked to say it again.
 *
 * Every number here is a placeholder to be tuned with scripts/tune_safeguard.ts.
 * Nothing else in the app hard-codes a threshold.
 */

/**
 * Master switch. When false the app behaves exactly as it did before the gate
 * existed: one translation call, shown immediately.
 */
export const SAFEGUARD_ENABLED = true;

/**
 * How the back-translation is compared to the original.
 *
 * 'embeddings' — cosine similarity of text-embedding-3-small vectors. Default,
 *                and measurably the better of the two: over 23 tuning phrases
 *                it produced drift scores spanning 0.52-1.00, separating good
 *                translations (0.89-0.95) from idioms and garbled input
 *                (0.52-0.80). Both texts go in one batched request, so this
 *                costs no extra round trip and runs slightly faster than the
 *                judge. Requires /v1/embeddings and text-embedding-3-small on
 *                the proxy allowlist (both present in proxy/worker.js).
 * 'judge'       — one gpt-4o call returns {score, reason}. Kept as a fallback,
 *                but it clusters: on the same 23 phrases it returned only 0.90
 *                or 1.00 and caught none of the deliberately broken sentences.
 *
 * Neither scorer detects input that was ambiguous to begin with — a vague
 * sentence translated faithfully scores high, correctly. See the README.
 */
export const DRIFT_SCORER: 'judge' | 'embeddings' = 'embeddings';

/**
 * Decision thresholds, applied to the combined confidence score.
 *
 *   confidence >= SHOW     → shown normally
 *   confidence >= CAUTION  → shown, marked imprecise, flagged terms highlighted
 *   below CAUTION          → withheld; the speaker is asked to rephrase
 */
export const THRESHOLDS = {
  SHOW: 0.85,
  CAUTION: 0.7,
} as const;

/**
 * Blocked attempts on a single utterance before the app stops asking the
 * patient to try again and recommends a human interpreter. Counted per turn,
 * never across the visit — a rough patch early on must not escalate a later
 * sentence that translated cleanly.
 */
export const MAX_BLOCKS_BEFORE_ESCALATION = 2;

/**
 * Timeout for each safeguard call. Shorter than the main request timeout: a
 * slow verification must degrade to CAUTION quickly rather than leave someone
 * watching a spinner mid-appointment.
 */
export const SAFEGUARD_TIMEOUT_MS = 8_000;

/**
 * Dev-only decision logging for threshold tuning (see services/safeguardLog).
 * Guarded by __DEV__ as well, so release builds write nothing to disk — the
 * app's "nothing is saved" promise covers transcripts and translations, and a
 * log file of both would break it.
 */
export const SAFEGUARD_LOGGING = true;
