import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from '../theme';

/**
 * A soft, continuous pulse shown while listening, so the speaker always knows
 * the app is hearing them. Purely decorative — hidden from screen readers
 * (the button's accessibility state announces "listening" instead). Renders as
 * a steady dot when Reduce Motion is on.
 */
export function Pulse({ color, size = 44 }: { color: string; size?: number }) {
  // Lazy state, not a ref: an Animated.Value read during render is exactly
  // what react-hooks/refs forbids, and useState's initialiser runs once.
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(0.55));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.9,
            duration: motion.pulse,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: motion.pulse,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, { toValue: 0.55, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, reducedMotion]);

  const ring = size * 0.64;
  const core = size * 0.42;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: core, height: core, borderRadius: core / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
