/**
 * The medication roster.
 *
 * These names are primed into every language's Whisper prompt so the model
 * spells them correctly instead of guessing them cold — mis-hearing a drug
 * name is one of the few transcription errors that can actually hurt someone.
 *
 * This file is the single source of truth for that list. Two things keep it
 * honest, both enforced by tests/terminology.test.ts:
 *   1. Every name here appears in every whisperPrompt in config/languages.ts.
 *   2. Every name here resolves to a real RxNorm concept, recorded with its
 *      RXCUI in config/terminology.json by scripts/verify_terminology.ts.
 *
 * RxNorm is the U.S. National Library of Medicine's normalized drug
 * vocabulary and a source vocabulary of the UMLS Metathesaurus. Verification
 * runs at build time against the public RxNav API, so the app itself makes no
 * extra network calls and gains no runtime dependency.
 */
export const MEDICATION_ROSTER = [
  'lisinopril',
  'amlodipine',
  'metformin',
  'atorvastatin',
  'simvastatin',
  'omeprazole',
  'levothyroxine',
  'losartan',
  'albuterol',
  'gabapentin',
  'hydrochlorothiazide',
  'metoprolol',
  'sertraline',
  'montelukast',
  'furosemide',
  'pantoprazole',
  'escitalopram',
  'amoxicillin',
  'prednisone',
  'insulin',
  'warfarin',
  'tramadol',
  'aspirin',
  'naproxen',
  'azithromycin',
  'ciprofloxacin',
  'clopidogrel',
  'tamsulosin',
] as const;
