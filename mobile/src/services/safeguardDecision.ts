/**
 * The gate's decision rule — deliberately a pure function in its own module.
 *
 * No network, no React, no React Native imports, so it can be unit-tested
 * directly (tests/decide.test.ts) and reasoned about in isolation. Everything
 * that can fail lives in services/safeguard.ts; everything that decides lives
 * here.
 */

import { MAX_BLOCKS_BEFORE_ESCALATION, THRESHOLDS } from '../config/safeguard';

export type GateVerdict =
  /** Confident: show the translation normally. */
  | 'show'
  /** Usable but imprecise: show it marked, with flagged terms highlighted. */
  | 'caution'
  /** Not trustworthy: withhold it and ask the speaker to say it again. */
  | 'block'
  /** Blocked too many times on one utterance: recommend a human interpreter. */
  | 'escalate';

export interface GateScores {
  /** 0–1 similarity between the original and the back-translation. null when scoring failed. */
  driftScore: number | null;
  /** 0–1 confidence the translating model reported about its own output. null when absent. */
  selfConfidence: number | null;
  /**
   * Blocked attempts already recorded for THIS utterance. Reset for every new
   * thing someone says — never a running total for the visit.
   */
  priorBlocks: number;
  /** True when a safeguard call errored or timed out, so the scores are untrustworthy. */
  degraded?: boolean;
}

export interface GateOutcome {
  verdict: GateVerdict;
  /** The combined score the verdict came from; null when the gate degraded. */
  confidence: number | null;
  /** Short machine-readable explanation, for the tuning log. */
  reason: string;
}

/** Returns a usable 0–1 number, or null for NaN/absent/non-finite input. */
function clamp01(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

/**
 * Turns scores into one of four verdicts.
 *
 * Two rules hold no matter what:
 *  - A translation is never shown unmarked unless it actually scored well. Any
 *    failure, timeout, or missing score falls to CAUTION, never to SHOW.
 *  - Confidence is the *weaker* of the two signals. A model that is sure of a
 *    translation that drifted, and an accurate translation the model doubted,
 *    both deserve the lower score.
 */
export function decide(scores: GateScores): GateOutcome {
  const drift = clamp01(scores.driftScore);
  const self = clamp01(scores.selfConfidence);

  // Fail safe: something broke, so we do not know how good this translation is.
  // Showing it unmarked would claim a certainty we never established.
  if (scores.degraded || drift === null || self === null) {
    return {
      verdict: 'caution',
      confidence: null,
      reason: scores.degraded ? 'check-failed' : 'score-missing',
    };
  }

  const confidence = Math.min(drift, self);

  if (confidence >= THRESHOLDS.SHOW) {
    return { verdict: 'show', confidence, reason: 'above-show' };
  }
  if (confidence >= THRESHOLDS.CAUTION) {
    return { verdict: 'caution', confidence, reason: 'between-thresholds' };
  }

  // Below the caution floor: withhold. Escalate once this utterance has been
  // blocked enough times that asking again only wastes a patient's effort.
  const blocksIncludingThisOne = scores.priorBlocks + 1;
  if (blocksIncludingThisOne >= MAX_BLOCKS_BEFORE_ESCALATION) {
    return { verdict: 'escalate', confidence, reason: 'repeated-blocks' };
  }
  return { verdict: 'block', confidence, reason: 'below-caution' };
}

/** True when the verdict means the translation reaches the reader at all. */
export function isDisplayable(verdict: GateVerdict): boolean {
  return verdict === 'show' || verdict === 'caution';
}
