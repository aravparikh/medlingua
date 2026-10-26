import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, useTheme, type ColorTokens } from '../theme';

/**
 * A placeholder bar: the shape of the sentence that is coming, at rest.
 *
 * It does not shimmer any more. "Nothing moves on its own" is the motion rule,
 * and a waiting state is where that rule earns its keep — a pulsing grey bar
 * reads as a social feed loading, which is the wrong promise to make to
 * someone waiting on a translation. The caption beside these bars says what is
 * happening; the bars only say how much of it there will be.
 */
export function SkeletonBar({ width, height = 18 }: { width: number | `${number}%`; height?: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View
      style={[styles.bar, { width, height }]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    />
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    bar: {
      borderRadius: radius.pill,
      // A wash of ink on paper, not a filled block: at 10% it reads as absence
      // rather than as content, which is what a placeholder is.
      backgroundColor: c.rule,
    },
  });
