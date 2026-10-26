import { View, type ViewProps } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '../../theme';
import { IconBase, type IconProps } from './Icon';

/**
 * Brand-scale drawings — the capsule language at illustration size. Same rules
 * as the glyphs: decorative, and hidden from screen readers by IconBase's
 * plain View wrapper (never by props on SVG elements — those leak into the
 * web DOM).
 */

/**
 * The logo mark: the brand bubble carrying the medical cross, filled.
 *
 * `cross` is the cross's colour — pass the ground the mark sits on so the
 * cross reads as a knockout rather than a drawn shape. It defaults to the page
 * ground, which is what that knockout wants in either scheme.
 */
export function BrandMark({ size = 34, color, cross, ...rest }: IconProps & { cross?: string }) {
  const { colors } = useTheme();

  return (
    <IconBase size={size} color={color} {...rest}>
      <Path
        d="M12 3.4c-5 0-9 3-9 6.8 0 2.2 1.3 4.1 3.2 5.3l-.5 4.3 4.2-1.9c.7.1 1.4.2 2.1.2 5 0 9-3 9-6.8 0-3.8-4-7.9-9-7.9Z"
        fill={color}
        strokeWidth={0}
      />
      <Path d="M12 7.6v5.2M9.4 10.2h5.2" stroke={cross ?? colors.bg} />
    </IconBase>
  );
}

/**
 * The interpreter-rights seal: a double ring (inner ring dotted, like a
 * rosette) around the brand cross. Drawn to photograph like an official mark
 * when the card is shown to staff.
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

/**
 * The wave mark: five bars and a crossbar that read as a waveform and a
 * medical cross at once. Fills only, no strokes, so it stays legible at 16px.
 *
 * The three colours are fixed rather than themed — this is a logo, and a logo
 * that changes hue between light and dark is two logos. It sits on the ground
 * unboxed: no circle, badge, or bubble around it.
 */
export function WaveMark({ size = 40, ...rest }: { size?: number } & ViewProps) {
  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no" accessibilityElementsHidden {...rest}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Rect x={6} y={28} width={6} height={8} rx={3} fill="#7FA3AD" />
        <Rect x={17} y={22} width={6} height={20} rx={3} fill="#2B3A45" />
        <Rect x={29} y={8} width={6} height={48} rx={3} fill="#2B3A45" />
        <Rect x={41} y={22} width={6} height={20} rx={3} fill="#2B3A45" />
        <Rect x={52} y={28} width={6} height={8} rx={3} fill="#7FA3AD" />
        <Rect x={17} y={29} width={30} height={6} rx={3} fill="#A9C3CB" />
      </Svg>
    </View>
  );
}
