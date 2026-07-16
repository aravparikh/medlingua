import { View, type ViewProps } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, strokes } from '../../theme';
import { IconBase, type IconProps } from './Icon';

/**
 * Brand-scale drawings — the capsule language at illustration size.
 * Same rules as glyphs: decorative, hidden from screen readers via plain
 * View props only (never on SVG elements — they leak into the web DOM).
 */

/** The logo mark: the brand bubble carrying the medical cross, filled. */
export function BrandMark({ size = 34, color, ...rest }: IconProps) {
  return (
    <IconBase size={size} color={color} {...rest}>
      <Path
        d="M12 3.4c-5 0-9 3-9 6.8 0 2.2 1.3 4.1 3.2 5.3l-.5 4.3 4.2-1.9c.7.1 1.4.2 2.1.2 5 0 9-3 9-6.8 0-3.8-4-7.9-9-7.9Z"
        fill={color}
        strokeWidth={0}
      />
      <Path d="M12 7.6v5.2M9.4 10.2h5.2" stroke={colors.primary} />
    </IconBase>
  );
}

/**
 * The interpreter-rights seal: a double ring (inner ring dotted, like a
 * rosette) around the brand cross. Drawn to photograph like an official
 * mark when the card is shown to staff.
 */
export function SealMark({ size = 52, color, ...rest }: IconProps) {
  return (
    <IconBase size={size} color={color} {...rest}>
      <Circle cx={12} cy={12} r={10.2} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={7.6} strokeWidth={1.6} strokeDasharray="0.1 2.9" />
      <Path d="M12 8.8v6.4M8.8 12h6.4" />
    </IconBase>
  );
}

const SCENE_VB_W = 260;
const SCENE_VB_H = 102;

/**
 * The empty-state scene: two capsule figures — the same people as the
 * body-map figure — with the sound arc traveling between them. One glance:
 * two people, two languages, one conversation.
 */
export function TwoVoicesScene({ width = 280, ...rest }: { width?: number } & ViewProps) {
  const height = (width * SCENE_VB_H) / SCENE_VB_W;
  return (
    <View
      style={{ width, height }}
      importantForAccessibility="no"
      accessibilityElementsHidden
      pointerEvents="none"
      {...rest}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${SCENE_VB_W} ${SCENE_VB_H}`}
        fill="none"
        strokeWidth={strokes.icon * 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* The clinician speaks English (teal, left)… */}
        <Circle cx={40} cy={30} r={13} stroke={colors.primary} fill={colors.surface} />
        <Rect x={26} y={49} width={28} height={44} rx={14} stroke={colors.primary} fill={colors.surface} />
        {/* …the patient answers in their language (indigo, right). */}
        <Circle cx={220} cy={30} r={13} stroke={colors.secondary} fill={colors.surface} />
        <Rect x={206} y={49} width={28} height={44} rx={14} stroke={colors.secondary} fill={colors.surface} />
        {/* The sound arc, both directions. */}
        <Circle cx={80} cy={58} r={4.2} fill={colors.primary} strokeWidth={0} />
        <Path d="M94 46a14.5 14.5 0 0 1 0 24" stroke={colors.accent} />
        <Path d="M108 38a25 25 0 0 1 0 40" stroke={colors.accent} />
        <Circle cx={180} cy={58} r={4.2} fill={colors.secondary} strokeWidth={0} />
        <Path d="M166 48a12.5 12.5 0 0 0 0 20" stroke={colors.accent} strokeDasharray="0.1 7" />
      </Svg>
    </View>
  );
}
