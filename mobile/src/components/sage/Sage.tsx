import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, gradients, useTheme } from '../../theme';

/**
 * The shared Sage ground: a spec gradient with one or two organic blobs
 * top-right, sitting behind content and never interactive. Every Sage screen
 * renders this instead of duplicating the shapes.
 *
 * Blob geometry is an approximation of the spec's elliptical border-radius
 * syntax, which React Native cannot express — per-corner radii give the same
 * organic read.
 */

type GroundVariant = 'ground' | 'listening' | 'transcript';

const GRADIENTS = {
  ground: gradients.ground,
  listening: gradients.listening,
  transcript: gradients.transcript,
};

interface BackgroundProps {
  variant?: GroundVariant;
  /** Blob 1 fill. Defaults to mint; transcript passes the pale #CFE0D2. */
  blobColor?: string;
  /** Hide the small white circle (transcript shows a single blob). */
  single?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SageBackground({ variant = 'ground', blobColor, single = false, children, style }: BackgroundProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const blob1 = blobColor ?? colors.mint;
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[...GRADIENTS[variant].colors]}
        locations={[...GRADIENTS[variant].locations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        importantForAccessibility="no"
      />
      <View style={[styles.blob1, { backgroundColor: blob1 }]} importantForAccessibility="no" pointerEvents="none" />
      {single ? null : (
        <View style={[styles.blob2, { backgroundColor: colors.white }]} importantForAccessibility="no" pointerEvents="none" />
      )}
      <View style={[styles.content, { paddingTop: insets.top }]}>{children}</View>
    </View>
  );
}

interface CardProps {
  /** 26 list rows, 22 action rows, 20 tiles/option rows. */
  radius?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The shared white Sage card: fill, radius, and the standard shadow. */
export function SageCard({ radius = 26, children, style }: CardProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.white, borderRadius: radius, ...elevation.card }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -70,
    width: 230,
    height: 200,
    borderTopLeftRadius: 118,
    borderTopRightRadius: 96,
    borderBottomRightRadius: 122,
    borderBottomLeftRadius: 84,
  },
  blob2: {
    position: 'absolute',
    top: 120,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});
