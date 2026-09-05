import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '../theme';

/**
 * Live microphone level (seven bars, see BAR_SENSITIVITY) — real feedback that the mic hears you, not
 * decoration. `level` is 0..1; null (web preview, no metering) rests the bars.
 * Hidden from screen readers: the panel's live region says "listening" in words.
 */
const BAR_SENSITIVITY = [0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55];
const MIN_H = 8;
const MAX_H = 48;

export function LevelMeter({ level }: { level: number | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} importantForAccessibility="no" accessibilityElementsHidden>
      {BAR_SENSITIVITY.map((sensitivity, i) => {
        const resting = MIN_H + (sensitivity - 0.55) * 10;
        const h = level == null ? resting : MIN_H + Math.min(1, level * sensitivity * 1.4) * (MAX_H - MIN_H);
        const active = level != null && level > 0.08;
        return <View key={i} style={[styles.bar, { height: h, backgroundColor: active ? colors.ink : colors.rule }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: MAX_H },
  bar: { width: 12, borderRadius: radius.control },
});
