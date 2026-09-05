import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type AccessibilityRole, type AccessibilityState, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, tapTarget, useTheme, type BilingualLabel, type ColorTokens } from '../../theme';
import { Label } from './Label';

export type ButtonVariant =
  /** The one action colour. */
  | 'accent'
  /** Patient-side primary: ink fill, paper text. */
  | 'ink'
  /** Secondary action: hairline border, ink text. */
  | 'outline'
  /** Tertiary: no chrome, accent text. */
  | 'quiet'
  /** Destructive or gate-held actions. */
  | 'danger';

interface Props {
  label: BilingualLabel;
  lang: string;
  speechTag?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  /** `primary` is the 64pt patient-facing height; `min` is 48. */
  size?: keyof typeof tapTarget;
  icon?: ReactNode;
  /** Icon above the label instead of beside it (tool row). */
  stacked?: boolean;
  /** Caption-size label for secondary actions that share a row. Never under 15pt. */
  dense?: boolean;
  flex?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  style?: StyleProp<ViewStyle>;
}

function fills(c: ColorTokens, v: ButtonVariant): { bg: string; pressed: string; border?: string; tone: 'onAccent' | 'onInk' | 'ink' | 'danger' } {
  switch (v) {
    case 'accent':
      return { bg: c.accent, pressed: c.accent, tone: 'onAccent' };
    case 'ink':
      return { bg: c.ink, pressed: c.ink, tone: 'onInk' };
    case 'outline':
      return { bg: c.bg, pressed: c.surfacePressed, border: c.border, tone: 'ink' };
    case 'danger':
      return { bg: c.dangerBg, pressed: c.dangerBg, border: c.danger, tone: 'danger' };
    default:
      return { bg: 'transparent', pressed: c.surfacePressed, tone: 'ink' };
  }
}

/**
 * Every tappable control in the redesign. One radius, one press response
 * (opacity + surface tint, `motion.tap`), targets never under 48pt.
 */
export function Button({
  label,
  lang,
  speechTag,
  onPress,
  onPressIn,
  disabled = false,
  variant = 'outline',
  size = 'min',
  icon,
  stacked = false,
  dense = false,
  flex = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  style,
}: Props) {
  const { colors } = useTheme();
  const f = fills(colors, variant);
  const a11yLabel = accessibilityLabel ?? (label.secondary ? `${label.primary}. ${label.secondary}` : label.primary);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={({ pressed }) => [
        styles.base,
        { minHeight: tapTarget[size], backgroundColor: pressed ? f.pressed : f.bg },
        f.border ? { borderWidth: 1, borderColor: f.border } : null,
        stacked && styles.stacked,
        flex && styles.flex,
        pressed && (variant === 'accent' || variant === 'ink') && styles.pressedFill,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Label
        primary={label.primary}
        secondary={label.secondary}
        lang={lang}
        speechTag={speechTag}
        tone={f.tone}
        size={dense ? 'caption' : 'body'}
        weight="semibold"
        align="center"
        numberOfLines={2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.control,
  },
  stacked: { flexDirection: 'column', gap: spacing.xxs, paddingHorizontal: spacing.xs },
  // NOT flex:1 — see PressableScale for the Yoga zero-height bug on device.
  flex: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto' },
  icon: { alignItems: 'center', justifyContent: 'center' },
  pressedFill: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});
