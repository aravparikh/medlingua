import { describe, expect, it } from 'vitest';

import { MAX_BLOCKS_BEFORE_ESCALATION, THRESHOLDS } from '../src/config/safeguard';
import { decide, isDisplayable, type GateScores } from '../src/services/safeguardDecision';

/** A clean, confident decision; each test overrides only what it is about. */
const base: GateScores = {
  driftScore: 0.95,
  selfConfidence: 0.95,
  priorBlocks: 0,
};

describe('decide — thresholds', () => {
  it('shows a translation both signals agree on', () => {
    expect(decide(base).verdict).toBe('show');
  });

  it('treats the SHOW threshold as inclusive', () => {
    const at = decide({ ...base, driftScore: THRESHOLDS.SHOW, selfConfidence: THRESHOLDS.SHOW });
    expect(at.verdict).toBe('show');
  });

  it('cautions just below the SHOW threshold', () => {
    expect(decide({ ...base, driftScore: THRESHOLDS.SHOW - 0.01 }).verdict).toBe('caution');
  });

  it('treats the CAUTION threshold as inclusive', () => {
    expect(decide({ ...base, driftScore: THRESHOLDS.CAUTION }).verdict).toBe('caution');
  });

  it('blocks just below the CAUTION threshold', () => {
    expect(decide({ ...base, driftScore: THRESHOLDS.CAUTION - 0.01 }).verdict).toBe('block');
  });
});

describe('decide — combining the two signals', () => {
  it('uses the weaker signal, not the average', () => {
    // A model certain of a translation that drifted badly must not be shown.
    const outcome = decide({ ...base, driftScore: 0.4, selfConfidence: 1 });
    expect(outcome.confidence).toBe(0.4);
    expect(outcome.verdict).toBe('block');
  });

  it('distrusts a faithful round trip the model itself doubted', () => {
    const outcome = decide({ ...base, driftScore: 1, selfConfidence: 0.5 });
    expect(outcome.confidence).toBe(0.5);
    expect(outcome.verdict).toBe('block');
  });
});

describe('decide — failing safe', () => {
  it('never shows an unverified translation, however high the other score', () => {
    const outcome = decide({ ...base, degraded: true });
    expect(outcome.verdict).toBe('caution');
    expect(outcome.confidence).toBeNull();
    expect(outcome.reason).toBe('check-failed');
  });

  it('cautions when the drift score is missing', () => {
    expect(decide({ ...base, driftScore: null }).verdict).toBe('caution');
  });

  it('cautions when the model reported no confidence', () => {
    expect(decide({ ...base, selfConfidence: null }).verdict).toBe('caution');
  });

  it('cautions rather than crashing on NaN', () => {
    expect(decide({ ...base, driftScore: NaN }).verdict).toBe('caution');
  });

  it('clamps out-of-range scores instead of trusting them', () => {
    expect(decide({ ...base, driftScore: 1.8, selfConfidence: 1.8 }).confidence).toBe(1);
    expect(decide({ ...base, driftScore: -3, selfConfidence: -3 }).confidence).toBe(0);
  });

  it('degrades to CAUTION even when the scores would have blocked', () => {
    // Verification failed, so the low scores are not evidence of anything.
    const outcome = decide({ driftScore: 0.1, selfConfidence: 0.1, priorBlocks: 0, degraded: true });
    expect(outcome.verdict).toBe('caution');
  });
});

describe('decide — escalation counts per utterance, not per visit', () => {
  const bad: GateScores = { driftScore: 0.2, selfConfidence: 0.2, priorBlocks: 0 };

  it('blocks the first failed attempt', () => {
    expect(decide(bad).verdict).toBe('block');
  });

  it('escalates once the utterance has been blocked enough times', () => {
    const outcome = decide({ ...bad, priorBlocks: MAX_BLOCKS_BEFORE_ESCALATION - 1 });
    expect(outcome.verdict).toBe('escalate');
    expect(outcome.reason).toBe('repeated-blocks');
  });

  it('stays escalated on further attempts at the same utterance', () => {
    expect(decide({ ...bad, priorBlocks: 5 }).verdict).toBe('escalate');
  });

  it('blocks, not escalates, when a fresh utterance starts at zero', () => {
    // The caller resets priorBlocks per turn. A rough sentence earlier in the
    // visit must never escalate the next thing the patient says.
    expect(decide({ ...bad, priorBlocks: 0 }).verdict).toBe('block');
  });

  it('does not escalate a high-scoring utterance regardless of history', () => {
    expect(decide({ ...base, priorBlocks: 9 }).verdict).toBe('show');
  });
});

describe('isDisplayable', () => {
  it('lets shown and cautioned translations reach the reader', () => {
    expect(isDisplayable('show')).toBe(true);
    expect(isDisplayable('caution')).toBe(true);
  });

  it('withholds blocked and escalated translations', () => {
    expect(isDisplayable('block')).toBe(false);
    expect(isDisplayable('escalate')).toBe(false);
  });
});
