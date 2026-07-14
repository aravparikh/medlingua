import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';

/**
 * A live microphone level meter — real feedback that the mic is hearing you,
 * not decorative animation. `level` is 0..1 (normalized from the recorder's
 * dB metering); null means metering is unavailable (web preview), where the
 * bars render at a calm resting height instead.
 *
 * Decorative to screen readers: the recording panel's live region announces
 * state in words.
 */
const BAR_COUNT = 7;
/** Each bar peaks at a slightly different level so the meter reads as a wave. */
const BAR_SENSITIVITY = [0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55];
/** Center-weighted capsule widths — the brand's capsule grammar as a meter. */
const BAR_WIDTH = [7, 9, 11, 13, 11, 9, 7];
const MIN_H = 8;
const MAX_H = 44;

export function LevelMeter({ level }: { level: number | null }) {
  return (
    <View style={styles.row} importantForAccessibility="no" accessibilityElementsHidden>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const resting = MIN_H + (BAR_SENSITIVITY[i] - 0.55) * 10;
        const h =
          level == null
            ? resting
            : MIN_H + Math.min(1, level * BAR_SENSITIVITY[i] * 1.4) * (MAX_H - MIN_H);
        const active = level != null && level > 0.08;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                width: BAR_WIDTH[i],
                height: Math.max(h, BAR_WIDTH[i]),
                backgroundColor: active ? colors.accent : colors.borderStrong,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: MAX_H,
  },
  bar: {
    borderRadius: radius.pill,
  },
});
