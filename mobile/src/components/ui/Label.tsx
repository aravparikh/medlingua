import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { fontFor, serifFor, spacing, text, typeCap, useTheme, type BilingualLabel, type ColorTokens, type Weight } from '../../theme';

type Tone = 'ink' | 'ink2' | 'onAccent' | 'onInk' | 'danger' | 'caution';
type Size = keyof typeof text;

interface Props extends BilingualLabel {
  /** Language of `primary`, for glyph selection and VoiceOver pronunciation. */
  lang: string;
  /** Language tag for accessibilityLanguage; defaults to none. */
  speechTag?: string;
  size?: Size;
  weight?: Weight;
  tone?: Tone;
  align?: 'left' | 'center';
  numberOfLines?: number;
  /** Set the primary line in the display serif. Focal text only. */
  serif?: boolean;
  style?: StyleProp<ViewStyle>;
}

function toneColor(c: ColorTokens, tone: Tone): { primary: string; secondary: string } {
  switch (tone) {
    case 'onAccent':
      return { primary: c.onAccent, secondary: c.onAccent };
    case 'onInk':
      return { primary: c.bg, secondary: c.bg };
    case 'danger':
      return { primary: c.danger, secondary: c.danger };
    case 'caution':
      return { primary: c.caution, secondary: c.caution };
    case 'ink2':
      return { primary: c.ink2, secondary: c.ink2 };
    default:
      return { primary: c.ink, secondary: c.ink2 };
  }
}

/**
 * THE bilingual label. Primary line in the reader's language at full size;
 * the other language, when present, one `caption` line beneath in the
 * secondary tone. Stacked, 4pt apart, never joined. See theme.ts LABEL RULE.
 */
export function Label({
  primary,
  secondary,
  lang,
  speechTag,
  size = 'body',
  weight = 'regular',
  tone = 'ink',
  align = 'left',
  numberOfLines,
  serif = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const tones = toneColor(colors, tone);
  const secondaryOpacity = tone === 'onAccent' || tone === 'onInk' ? 0.8 : 1;
  const alignStyle: TextStyle = { textAlign: align };

  return (
    <View style={[styles.wrap, align === 'center' && styles.center, style]}>
      <Text
        style={[text[size], serif ? serifFor(lang) : fontFor(lang, weight), { color: tones.primary }, alignStyle]}
        accessibilityLanguage={speechTag}
        numberOfLines={numberOfLines}
        allowFontScaling
        maxFontSizeMultiplier={size === 'focal' ? 1.4 : 2}
      >
        {primary}
      </Text>
      {secondary ? (
        <Text
          style={[text.caption, fontFor('en', 'regular'), { color: tones.secondary, opacity: secondaryOpacity }, alignStyle]}
          numberOfLines={numberOfLines}
          allowFontScaling
          maxFontSizeMultiplier={typeCap.content}
        >
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs, flexShrink: 1 },
  center: { alignItems: 'center' },
});
