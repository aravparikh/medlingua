import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import type { FlaggedTerm } from '../../services/openai';

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders `source` with the safeguard's flagged spans marked in place, so the
 * clinician sees exactly which words the model doubted rather than being told
 * the sentence as a whole is shaky. Returns the plain string when nothing is
 * flagged — the common case stays allocation-free.
 */
export function highlightFlagged(source: string, terms: FlaggedTerm[] | undefined, mark: StyleProp<TextStyle>): ReactNode {
  const spans = (terms ?? []).map((term) => term.source.trim()).filter((s) => s.length > 0);
  if (spans.length === 0) return source;

  // Longest first, so "chest pain" wins over a nested "pain".
  const pattern = spans
    .sort((a, b) => b.length - a.length)
    .map(escapeForRegExp)
    .join('|');

  let parts: string[];
  try {
    parts = source.split(new RegExp(`(${pattern})`, 'gi'));
  } catch {
    return source;
  }
  const flagged = new Set(spans.map((s) => s.toLowerCase()));
  return parts.map((part, i) =>
    flagged.has(part.toLowerCase()) ? (
      <Text key={i} style={mark}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}
