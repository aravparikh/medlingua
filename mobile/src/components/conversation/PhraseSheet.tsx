import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ENGLISH, type Language } from '../../config/languages';
import { CLINICIAN_PHRASES, EMERGENCY_PHRASES, PATIENT_PHRASES, type Phrase } from '../../config/phrases';
import { t } from '../../i18n/strings';
import { bilingual, fontFor, radius, spacing, tapTarget, text, typeCap, useTheme, type ColorTokens } from '../../theme';
import { BodyIcon, BrandGlyph, ChatIcon, SpeakIcon } from '../icons';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Sheet } from './Sheet';

interface Props {
  visible: boolean;
  otherLanguage: Language;
  onClose: () => void;
  onBodyMap: () => void;
  onPhrase: (phrase: Phrase, who: Language) => void;
  onPain: (n: number) => void;
}

/** Pain 0–10 onto the four-stop ramp: none, mild, moderate, severe. */
function painColor(c: ColorTokens, n: number): string {
  if (n === 0) return c.pain[0];
  if (n <= 3) return c.pain[1];
  if (n <= 6) return c.pain[2];
  return c.pain[3];
}

function SectionHeading({ label, tone = 'ink2' }: { label: string; tone?: 'ink2' | 'danger' }) {
  const { colors } = useTheme();
  return (
    <Text style={[text.caption, fontFor('en', 'semibold'), styles.section, { color: tone === 'danger' ? colors.danger : colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={typeCap.content}>
      {label}
    </Text>
  );
}

interface RowProps {
  phrase: Phrase;
  speaker: Language;
  listener: Language;
  urgent?: boolean;
  onPress: () => void;
}

/** One phrase: hairline-separated row, speaker's text first, listener's beneath. */
function PhraseRow({ phrase, speaker, listener, urgent, onPress }: RowProps) {
  const { colors } = useTheme();
  const tint = urgent ? colors.danger : speaker.code === 'en' ? colors.accent : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${phrase.text[speaker.code]}. ${phrase.text[listener.code]}`}
      accessibilityLanguage={speaker.speechTag}
      style={({ pressed }) => [styles.row, { borderTopColor: colors.rule }, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      <BrandGlyph name={phrase.icon} size={24} color={tint} />
      <Label
        {...bilingual(phrase.text[speaker.code], phrase.text[listener.code])}
        lang={speaker.code}
        speechTag={speaker.speechTag}
        weight="semibold"
        style={styles.rowText}
      />
      <SpeakIcon size={22} color={colors.ink2} />
    </Pressable>
  );
}

/**
 * Pre-translated phrases: instant, offline, no model in the loop. Order is
 * by urgency, not by speaker — the body map and emergencies come first.
 */
export function PhraseSheet({ visible, otherLanguage, onClose, onBodyMap, onPhrase, onPain }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={bilingual(other.quickPhrases, en.quickPhrases)}
      otherLanguage={otherLanguage}
      icon={<ChatIcon size={24} color={colors.ink} />}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Button
          label={bilingual(other.whereHurts, en.whereHurts)}
          lang={otherLanguage.code}
          speechTag={otherLanguage.speechTag}
          variant="accent"
          size="primary"
          icon={<BodyIcon size={28} color={colors.onAccent} />}
          onPress={onBodyMap}
        />

        <SectionHeading label={bilingual(other.emergency, en.emergency).primary} tone="danger" />
        {EMERGENCY_PHRASES.map((phrase) => (
          <PhraseRow key={phrase.id} phrase={phrase} speaker={otherLanguage} listener={ENGLISH} urgent onPress={() => onPhrase(phrase, otherLanguage)} />
        ))}

        <SectionHeading label={other.painScaleLabel} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.painRow}>
          {Array.from({ length: 11 }, (_, n) => {
            const tint = painColor(colors, n);
            return (
              <Pressable
                key={n}
                onPress={() => onPain(n)}
                accessibilityRole="button"
                accessibilityLabel={other.painIs.replace('{n}', String(n))}
                accessibilityLanguage={otherLanguage.speechTag}
                style={({ pressed }) => [styles.painChip, { borderColor: tint, backgroundColor: pressed ? colors.surfacePressed : colors.bg }]}
              >
                <Text style={[text.title, fontFor('en', 'semibold'), { color: tint }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeading label={`${ENGLISH.nativeName} → ${otherLanguage.nativeName}`} />
        {CLINICIAN_PHRASES.map((phrase) => (
          <PhraseRow key={phrase.id} phrase={phrase} speaker={ENGLISH} listener={otherLanguage} onPress={() => onPhrase(phrase, ENGLISH)} />
        ))}

        <SectionHeading label={`${otherLanguage.nativeName} → ${ENGLISH.nativeName}`} />
        {PATIENT_PHRASES.map((phrase) => (
          <PhraseRow key={phrase.id} phrase={phrase} speaker={otherLanguage} listener={ENGLISH} onPress={() => onPhrase(phrase, otherLanguage)} />
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.xxs },
  section: { marginTop: spacing.lg, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: tapTarget.primary,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  painRow: { gap: spacing.xs, paddingVertical: spacing.xxs },
  painChip: {
    minWidth: tapTarget.min,
    minHeight: tapTarget.min,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
