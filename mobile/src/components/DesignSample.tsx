import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  bilingual,
  fontFor,
  ROLE_EDGE_WIDTH,
  radius,
  roles,
  spacing,
  tapTarget,
  text,
  useTheme,
  type BilingualLabel,
  type ColorTokens,
} from '../theme';

/**
 * Design-system sample. Not wired into the app: it exists so the tokens can be
 * judged on a real composition before any screen is rewritten.
 *
 * Shows the three things step 3 will lean on everywhere:
 *   - a ledger turn (history) and the live display line (the hero);
 *   - speaker attribution by edge + script + glyph, never hue alone;
 *   - the bilingual label rule on a shared control.
 */

interface TurnProps {
  role: keyof typeof roles;
  languageCode: string;
  children: string;
}

/** One past turn in the ledger: quiet, single line of hierarchy, role edge. */
function LedgerTurn({ role, languageCode, children }: TurnProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  return (
    <View style={[s.turn, { borderLeftColor: colors[roles[role].edge] }]}>
      <Text style={[s.turnText, fontFor(languageCode, 'regular')]}>{children}</Text>
    </View>
  );
}

/** The live line: what the reader needs right now, at standing-height size. */
function LiveLine({ role, languageCode, children }: TurnProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  return (
    <View style={[s.live, { borderLeftColor: colors[roles[role].edge] }]}>
      <Text style={[s.liveText, fontFor(languageCode, 'semibold')]} accessibilityLiveRegion="polite">
        {children}
      </Text>
    </View>
  );
}

interface ButtonProps {
  label: BilingualLabel;
  languageCode: string;
  onPress: () => void;
}

/** A shared control: patient language primary, English beneath, never joined. */
function SharedButton({ label, languageCode, onPress }: ButtonProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label.secondary ? `${label.primary}. ${label.secondary}` : label.primary}
      style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
    >
      <Text style={[s.buttonPrimary, fontFor(languageCode, 'semibold')]}>{label.primary}</Text>
      {label.secondary ? <Text style={s.buttonSecondary}>{label.secondary}</Text> : null}
    </Pressable>
  );
}

export function DesignSample() {
  const { colors } = useTheme();
  const s = styles(colors);
  return (
    <View style={s.page}>
      <View style={s.ledger}>
        <LedgerTurn role="clinician" languageCode="en">
          Where does it hurt?
        </LedgerTurn>
        <LedgerTurn role="patient" languageCode="hi">
          मुझे सीने में दर्द है।
        </LedgerTurn>
      </View>

      <LiveLine role="clinician" languageCode="hi">
        क्या यह दर्द बायीं ओर है या दायीं ओर?
      </LiveLine>

      <SharedButton
        label={bilingual('हो गया', 'Done')}
        languageCode="hi"
        onPress={() => undefined}
      />
    </View>
  );
}

const styles = (c: ColorTokens) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.bg, padding: spacing.md, gap: spacing.md },
    ledger: { gap: spacing.xs },
    turn: {
      borderLeftWidth: ROLE_EDGE_WIDTH,
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xxs,
    },
    turnText: { ...text.body, color: c.ink2 },
    live: {
      flex: 1,
      justifyContent: 'center',
      borderLeftWidth: ROLE_EDGE_WIDTH,
      paddingLeft: spacing.md,
    },
    liveText: { ...text.display, color: c.ink },
    button: {
      minHeight: tapTarget.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.control,
      backgroundColor: c.accent,
    },
    buttonPressed: { opacity: 0.85 },
    buttonPrimary: { ...text.body, color: c.onAccent },
    buttonSecondary: { ...text.caption, color: c.onAccent, marginTop: spacing.xxs, opacity: 0.85 },
  });
