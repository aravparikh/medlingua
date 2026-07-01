import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { LANGUAGES } from '../config/languages';
import { STRINGS, type UIStrings } from '../i18n/strings';
import { colors, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';
import { Appear } from '../components/Appear';
import { PressableScale } from '../components/PressableScale';

interface Props {
  onDone: () => void;
}

/**
 * Three visual slides. Onboarding runs before a language is chosen, so each
 * caption is shown in all five languages — a big pictogram carries the meaning
 * and the text confirms it in whichever language the reader knows.
 */
const SLIDES: { icon: 'language' | 'mic' | 'volume-high'; key: keyof UIStrings }[] = [
  { icon: 'language', key: 'onboarding1' },
  { icon: 'mic', key: 'onboarding2' },
  { icon: 'volume-high', key: 'onboarding3' },
];

const ALL_CODES = ['en', ...LANGUAGES.map((l) => l.code)];

export function OnboardingScreen({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (last) onDone();
    else setIndex(index + 1);
  };

  return (
    <View style={styles.screen}>
      <Pressable
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel={ALL_CODES.map((c) => STRINGS[c].skip).join(' — ')}
        style={({ pressed }) => [styles.skip, pressed && styles.pressedDim]}
      >
        <Text style={styles.skipText}>{ALL_CODES.map((c) => STRINGS[c].skip).join(' · ')}</Text>
      </Pressable>

      <Appear key={index} style={styles.slide}>
        <View style={styles.iconCircleOuter} importantForAccessibility="no">
          <View style={styles.iconCircle}>
            <Ionicons name={slide.icon} size={72} color={colors.primary} />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.captions}>
          <Text style={styles.captionMain}>{STRINGS.en[slide.key]}</Text>
          {LANGUAGES.map((l) => (
            <Text key={l.code} style={styles.caption} accessibilityLanguage={l.speechTag}>
              {STRINGS[l.code][slide.key]}
            </Text>
          ))}
        </ScrollView>
      </Appear>

      <View style={styles.dots} importantForAccessibility="no">
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <PressableScale
        onPress={advance}
        accessibilityRole="button"
        accessibilityLabel={ALL_CODES.map((c) => STRINGS[c][last ? 'start' : 'next']).join(' — ')}
        style={styles.cta}
      >
        {({ pressed }) => (
          <View style={[styles.ctaInner, { backgroundColor: pressed ? colors.primaryPressed : colors.primary }]}>
            <Text style={styles.ctaText}>
              {last
                ? `${STRINGS.en.start} · ${LANGUAGES.map((l) => STRINGS[l.code].start).join(' · ')}`
                : STRINGS.en.next}
            </Text>
            <Ionicons name="arrow-forward" size={24} color={colors.onPrimary} />
          </View>
        )}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  skip: {
    alignSelf: 'flex-end',
    minHeight: MIN_TARGET - 16,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textFaint,
  },
  pressedDim: {
    opacity: 0.6,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  iconCircleOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  captions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  captionMain: {
    fontFamily: fonts.display,
    fontSize: type.button,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 28,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  cta: {
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  ctaInner: {
    minHeight: MIN_TARGET + 8,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ctaText: {
    color: colors.onPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    textAlign: 'center',
    flexShrink: 1,
  },
});
