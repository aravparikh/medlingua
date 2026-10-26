import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { motion, strokes } from '../../theme';

/**
 * The sound arc, alive: while `active`, the two arcs ripple outward from the
 * dot in sequence — the visible "the phone is speaking right now" signal,
 * readable across a room. Settles to the static SpeakIcon otherwise.
 *
 * Purely visual: it only ever READS playback state via the `active` prop and
 * never touches the speech pipeline. Opacity is animated on plain
 * Animated.Views layered over static SVGs (react-native-svg props are never
 * animated, and accessibility props stay on Views — both web-safe patterns).
 * Static under Reduce Motion.
 */
export function SpeakingArc({ size = 14, color, active }: { size?: number; color: string; active: boolean }) {
  const reducedMotion = useReducedMotion();
  // Lazy state, not a ref: an Animated.Value read during render is exactly
  // what react-hooks/refs forbids, and useState's initialiser runs once.
  const [arc1] = useState(() => new Animated.Value(1));
  const [arc2] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!active || reducedMotion) {
      arc1.setValue(1);
      arc2.setValue(1);
      return;
    }
    // One ripple per motion.pulse cycle: dim both, then the arcs light up
    // in sequence away from the dot, hold, repeat. Ease matches Pulse.
    const quarter = motion.pulse / 4;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(arc1, { toValue: 0.2, duration: quarter / 2, useNativeDriver: true }),
          Animated.timing(arc2, { toValue: 0.2, duration: quarter / 2, useNativeDriver: true }),
        ]),
        Animated.timing(arc1, { toValue: 1, duration: quarter, useNativeDriver: true }),
        Animated.timing(arc2, { toValue: 1, duration: quarter, useNativeDriver: true }),
        Animated.delay(quarter),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reducedMotion, arc1, arc2]);

  const strokeWidth = size <= 16 ? strokes.iconSmall : strokes.icon;
  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
  };

  return (
    <View
      style={{ width: size, height: size }}
      importantForAccessibility="no"
      accessibilityElementsHidden
      pointerEvents="none"
    >
      <Svg {...svgProps}>
        <Circle cx={6.2} cy={12} r={2.1} fill={color} strokeWidth={0} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: arc1 }]}>
        <Svg {...svgProps}>
          <Path d="M11.6 8.6a4.9 4.9 0 0 1 0 6.8" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: arc2 }]}>
        <Svg {...svgProps}>
          <Path d="M15.2 5.8a9 9 0 0 1 0 12.4" />
        </Svg>
      </Animated.View>
    </View>
  );
}
