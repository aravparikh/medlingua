import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, radius, spacing } from '../theme';

/**
 * A shimmering placeholder bar. Composed into skeleton cards so "working"
 * states preview the shape of what's coming instead of showing a blank gap.
 */
export function SkeletonBar({ width, height = 18 }: { width: number | `${number}%`; height?: number }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      style={[styles.bar, { width, height, opacity }]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    />
  );
}

/** Skeleton of an incoming translation turn, shown while Whisper + GPT work. */
export function TurnSkeleton({ alignRight }: { alignRight?: boolean }) {
  return (
    <View style={[styles.card, alignRight ? styles.right : styles.left]}>
      <SkeletonBar width={96} height={13} />
      <SkeletonBar width="88%" height={15} />
      <View style={styles.gap} />
      <SkeletonBar width={80} height={13} />
      <SkeletonBar width="94%" height={26} />
      <SkeletonBar width="70%" height={26} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: radius.sm,
    backgroundColor: colors.primaryTint,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    width: '88%',
  },
  left: {
    alignSelf: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
  },
  gap: {
    height: spacing.xs,
  },
});
