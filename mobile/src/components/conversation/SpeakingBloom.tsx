import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { bloom, useTheme } from '../../theme';

const AnimatedView = Animated.View;

interface Props {
  /** True while the mic is open or a translation is being spoken aloud. */
  active: boolean;
  /**
   * Live microphone level, 0..1, or null when unavailable. Peaks make the
   * bloom brighter and taller — so what you see is the room, not a loop.
   */
  level: number | null;
}

/** How much of the screen the light reaches, feathered to nothing at the top. */
const BLOOM_HEIGHT_RATIO = 0.42;
const BREATH_MS = 3200;
/** The second layer runs slower and out of phase so the colour drifts. */
const DRIFT_MS = 5100;

/**
 * The speaking presence: a warm light rising from the bottom of the screen
 * while the app is listening or talking.
 *
 * It is deliberately the only warm thing in a cool palette, and deliberately
 * carries no text — which is what lets it be this saturated without a contrast
 * problem. Two radial layers breathe out of phase so the colour drifts instead
 * of pulsing mechanically, and the live mic level is smoothed toward its target
 * each frame rather than applied raw, so a loud consonant does not make it
 * flicker.
 *
 * Reduce Motion holds it still: the light stays, the breathing stops.
 */
export function SpeakingBloom({ active, level }: Props) {
  const { scheme, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const palette = bloom[scheme];

  const [breath] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));
  /** Smoothed amplitude. Never set straight from `level` — that jitters. */
  const [amplitude] = useState(() => new Animated.Value(0));
  const [presence] = useState(() => new Animated.Value(0));
  const [staticPeak] = useState(() => new Animated.Value(palette.peak));
  const [staticDrift] = useState(() => new Animated.Value(0.5));
  const heightRef = useRef(0);

  // Fade the whole layer in and out, so ending a turn does not snap the light off.
  useEffect(() => {
    Animated.timing(presence, {
      toValue: active ? 1 : 0,
      duration: active ? 420 : 620,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, presence]);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const loop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    const breathing = loop(breath, BREATH_MS / 2);
    const drifting = loop(drift, DRIFT_MS / 2);
    breathing.start();
    drifting.start();
    return () => {
      breathing.stop();
      drifting.stop();
    };
  }, [active, reducedMotion, breath, drift]);

  // Ease toward the measured level instead of tracking it exactly.
  useEffect(() => {
    Animated.timing(amplitude, {
      toValue: level == null ? 0 : Math.min(1, Math.max(0, level)),
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [level, amplitude]);

  const onLayout = (event: LayoutChangeEvent) => {
    heightRef.current = event.nativeEvent.layout.height;
  };

  const scale = reducedMotion
    ? 1
    : Animated.add(
        breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
        amplitude.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
      );
  const opacity = Animated.multiply(
    presence,
    reducedMotion
      ? staticPeak
      : Animated.add(
          breath.interpolate({ inputRange: [0, 1], outputRange: [0.85 * palette.peak, palette.peak] }),
          amplitude.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
        ),
  );
  const driftOpacity = Animated.multiply(
    presence,
    reducedMotion
      ? staticDrift
      : drift.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.62] }),
  );

  return (
    <View
      style={styles.wrap}
      onLayout={onLayout}
      pointerEvents="none"
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      <AnimatedView style={[styles.layer, { opacity, transform: [{ scale }] }]}>
        <Gradient from={palette.inner} to={colors.bg} />
      </AnimatedView>
      <AnimatedView style={[styles.layer, styles.drift, { opacity: driftOpacity }]}>
        <Gradient from={palette.outer} to={colors.bg} />
      </AnimatedView>
    </View>
  );
}

/**
 * One feathered radial layer. The gradient ends at the page ground rather than
 * at transparent: an alpha ramp to nothing banded visibly on device, while a
 * ramp to the ground colour reads as light with no edge at all.
 */
function Gradient({ from, to }: { from: string; to: string }) {
  const id = `bloom-${from.replace('#', '')}`;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="100%" rx="80%" ry="100%">
          <Stop offset="0%" stopColor={from} stopOpacity={0.95} />
          <Stop offset="45%" stopColor={from} stopOpacity={0.45} />
          <Stop offset="100%" stopColor={to} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${BLOOM_HEIGHT_RATIO * 100}%`,
  },
  layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  drift: { bottom: '-6%' },
});
