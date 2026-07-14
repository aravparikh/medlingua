import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Svg from 'react-native-svg';

import { strokes } from '../../theme';

/**
 * Every glyph accepts the same contract. `color` is required on purpose —
 * an icon with no deliberate color is a design decision nobody made.
 */
export interface IconProps extends ViewProps {
  size?: number;
  color: string;
}

/**
 * The one drawing surface for MedLingua's bespoke icon set.
 *
 * The language (derived from the body-map capsule figure): 24×24 grid with a
 * 2px optical margin, 2.5 stroke, round caps and joins, soft geometry, no
 * sharp corners anywhere. Glyphs rendered at ≤16px bump to a 3 stroke so they
 * keep their weight at chip size.
 *
 * Accessibility: icons are always decorative — the pressable that contains
 * them carries the bilingual label. The hiding props live on the plain View
 * wrapper, never on SVG elements: RN accessibility props on react-native-svg
 * elements leak into the web DOM and have broken rendering before (see the
 * BodyMap figure fix).
 */
export function IconBase({ size = 24, color, children, style, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <View
      style={[{ width: size, height: size }, style]}
      importantForAccessibility="no"
      accessibilityElementsHidden
      pointerEvents="none"
      {...rest}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={size <= 16 ? strokes.iconSmall : strokes.icon}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </Svg>
    </View>
  );
}
