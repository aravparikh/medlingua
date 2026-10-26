import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CloseIcon, SwapIcon } from './icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { bilingual, radius, serifFor, spacing, tapTarget, useTheme, type ColorTokens } from '../theme';
import { PressableScale } from './PressableScale';
import { Label } from './ui/Label';

interface Props {
  /** The translation to display, or null when hidden. */
  text: string | null;
  /** Language the text is in — drives the a11y language tag. */
  language: Language | null;
  /** The conversation's non-English side, for bilingual chrome labels. */
  otherLanguage: Language;
  onClose: () => void;
}

/**
 * Deterministic "largest type that fits" — adjustsFontSizeToFit is unreliable
 * on web, so size by length instead. Steps chosen so a short answer ("Sí.")
 * fills the room while a long instruction stays readable without scrolling.
 */
function fitFontSize(text: string): number {
  const len = text.length;
  if (len <= 16) return 72;
  if (len <= 40) return 56;
  if (len <= 90) return 44;
  if (len <= 170) return 34;
  if (len <= 300) return 27;
  return 22;
}

/**
 * A translation blown up to fill the whole screen — for loud rooms, low vision,
 * or holding the phone across a bed rail (flip turns it toward the other
 * person). Tap anywhere to dismiss.
 *
 * This is the most focal text in the app, so it is set in the display serif of
 * the language it is written in — the same face the live line uses, at the
 * largest size that fits.
 */
export function FullscreenTranslation({ text, language, otherLanguage, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);
  const en = t('en');
  const other = t(otherLanguage.code);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // A fresh open always starts unflipped, whatever the last session did.
  useEffect(() => {
    if (text != null) setFlipped(false);
  }, [text]);

  if (text == null || language == null) return null;
  const fontSize = fitFontSize(text);
  const flipLabel = bilingual(other.flip, en.flip);
  const hintLabel = bilingual(other.tapToClose, en.tapToClose);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.screen}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={`${other.tapToClose}. ${en.tapToClose}`}
      >
        <View style={styles.topBar}>
          {/* Flip is a real feature and has to be named; close is the one
             glyph that outperforms either language, so it carries its names
             in the accessibility label only. */}
          <PressableScale
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFlipped(!flipped);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: flipped }}
            accessibilityLabel={`${other.flip}. ${en.flip}`}
            style={[styles.flip, flipped && styles.flipActive]}
          >
            <SwapIcon size={22} color={flipped ? colors.bg : colors.ink} />
            <Label
              primary={flipLabel.primary}
              secondary={flipLabel.secondary}
              lang={otherLanguage.code}
              speechTag={otherLanguage.speechTag}
              size="caption"
              weight="semibold"
              tone={flipped ? 'onInk' : 'ink'}
            />
          </PressableScale>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close}. ${en.close}`}
            style={({ pressed }) => [styles.close, pressed && styles.pressedFill]}
          >
            <CloseIcon size={24} color={colors.ink} />
          </Pressable>
        </View>

        <View style={[styles.body, flipped && styles.bodyFlipped]}>
          <Text
            style={[styles.bigText, serifFor(language.code), { fontSize, lineHeight: fontSize * 1.2 }]}
            accessibilityLanguage={language.speechTag}
            accessibilityLiveRegion="polite"
            // Already sized to the largest type that fits — scaling on top
            // of that would push text off-screen with no way to scroll.
            allowFontScaling={false}
          >
            {text}
          </Text>
        </View>

        <Label
          primary={hintLabel.primary}
          secondary={hintLabel.secondary}
          lang={otherLanguage.code}
          size="caption"
          tone="ink2"
          align="center"
          style={styles.closeHint}
        />
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    flip: {
      minHeight: tapTarget.min,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
    },
    flipActive: {
      backgroundColor: c.ink,
    },
    close: {
      width: tapTarget.min,
      height: tapTarget.min,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
    },
    pressedFill: {
      backgroundColor: c.surfacePressed,
    },
    body: {
      flex: 1,
      justifyContent: 'center',
    },
    bodyFlipped: {
      transform: [{ rotate: '180deg' }],
    },
    bigText: {
      color: c.ink,
      textAlign: 'center',
    },
    closeHint: {
      alignSelf: 'center',
    },
  });
