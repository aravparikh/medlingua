/**
 * The confidence gate, end to end.
 *
 * Translate (with the model reporting its own doubts) → translate the result
 * back without sight of the original → score how much survived the round trip
 * → decide whether anyone gets to see it.
 *
 * The split of responsibilities is deliberate: everything that can fail lives
 * here, and the rule that turns scores into a verdict lives in
 * safeguardDecision.ts as a pure function, so it can be tested and tuned
 * without a network.
 */

import { DRIFT_SCORER } from '../config/safeguard';
import type { Language } from '../config/languages';
import {
  backTranslate,
  embeddingSimilarity,
  judgeEquivalence,
  translateStructured,
  type FlaggedTerm,
} from './openai';
import { decide, type GateOutcome, type GateVerdict } from './safeguardDecision';
import { logGateDecision } from './safeguardLog';

export interface GateResult {
  translation: string;
  flaggedTerms: FlaggedTerm[];
  verdict: GateVerdict;
  /** Why the verdict came out that way, for the log and the escalation record. */
  reason: string;
  /** Combined score behind the verdict; null when verification failed. */
  confidence: number | null;
  drift: number | null;
  selfConfidence: number | null;
  /** Kept for the tuning log and the dev inspector; never shown to a patient. */
  backTranslation: string;
  latencyMs: number;
}

/**
 * Scores how much of `original` survives in `back`. Returns the score plus the
 * judge's reason (empty for the embeddings scorer, which has no words for it).
 */
async function scoreDrift(
  original: string,
  back: string,
  language: Language,
): Promise<{ score: number; reason: string }> {
  if (DRIFT_SCORER === 'embeddings') {
    return { score: await embeddingSimilarity(original, back), reason: '' };
  }
  return judgeEquivalence(original, back, language);
}

/**
 * Translates `text` and decides whether it is trustworthy enough to show.
 *
 * `priorBlocks` is the number of times THIS utterance has already been blocked
 * — the caller resets it for every new thing someone says, so a difficult
 * sentence early in a visit can never escalate a later one.
 *
 * Throws only when the translation itself fails (network, API error), which the
 * existing error UI already handles. A failure of the *verification* steps is
 * not an error: it degrades to CAUTION, because an unverified translation may
 * still be useful as long as it is not presented as certain.
 */
export async function gatedTranslate(
  text: string,
  from: Language,
  to: Language,
  priorBlocks: number,
  /** Fires once the translation exists and verification begins, so the UI can
   * say "checking" instead of leaving one vague spinner across both stages. */
  onVerifying?: () => void,
): Promise<GateResult> {
  const startedAt = Date.now();

  // Step 1. If this throws, translation genuinely failed — let it propagate.
  const { translation, flaggedTerms, selfConfidence } = await translateStructured(text, from, to);
  onVerifying?.();

  // Steps 2 and 3. Any failure here means we could not verify, not that the
  // translation is wrong — so we fall to CAUTION rather than hiding or trusting it.
  let back = '';
  let drift: number | null = null;
  let judgeReason = '';
  let degraded = false;
  try {
    back = await backTranslate(translation, to, from);
    const scored = await scoreDrift(text, back, from);
    drift = scored.score;
    judgeReason = scored.reason;
  } catch {
    degraded = true;
  }

  // Step 4.
  const outcome: GateOutcome = decide({
    driftScore: drift,
    selfConfidence,
    priorBlocks,
    degraded,
  });

  const latencyMs = Date.now() - startedAt;

  // Step 5 — dev builds only; see the privacy contract in safeguardLog.ts.
  logGateDecision({
    at: new Date().toISOString(),
    from: from.code,
    to: to.code,
    original: text,
    translation,
    backTranslation: back,
    drift,
    selfConfidence,
    confidence: outcome.confidence,
    verdict: outcome.verdict,
    reason: outcome.reason,
    judgeReason,
    flaggedTerms: flaggedTerms.map((term) => term.source),
    attempt: priorBlocks,
    latencyMs,
    scorer: DRIFT_SCORER,
  });

  return {
    translation,
    flaggedTerms,
    verdict: outcome.verdict,
    reason: outcome.reason,
    confidence: outcome.confidence,
    drift,
    selfConfidence,
    backTranslation: back,
    latencyMs,
  };
}
