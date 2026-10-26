import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { LANGUAGES, type Language } from '../config/languages';
import { t } from '../i18n/strings';
import { loadPrefs } from '../services/storage';
import { elevation, fontFor, gradients, radius, serifFor, typeCap, useTheme, type ColorTokens } from '../theme';
import { CheckIcon, ChevronForwardIcon } from '../components/icons';
import { SageBackground } from '../components/sage/Sage';

interface Props {
  onSelect: (language: Language) => void;
}

/**
 * Sage language selector: the MedLingua title in Newsreader 500 over the
 * italic tagline, then white cards (radius 26) with the native name big in
 * the language's own serif. The chosen card fills with the selected gradient,
 * gains a mint border, a check badge on the left and the localized "chosen"
 * word on the right. Whole card is the tap target; selection logic unchanged.
 */
export function LanguageSelectScreen({ onSelect }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  // Whichever language this device chose last, so returning to the screen
  // shows where you left off rather than an unmarked list.
  const [chosenCode] = useState(() => loadPrefs().languageCode);
  const en = t('en');

  return (
    <SageBackground>
      <View style={s.titleBlock}>
        <Text style={[s.appName, serifFor('en', 'medium'), { color: colors.ink }]} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
          MedLingua<Text style={{ color: colors.accentText }}>.</Text>
        </Text>
        <Text
          style={[s.tagline, serifFor('en', 'italic'), { color: colors.inkSoft }]}
          accessibilityLanguage="en-US"
          allowFontScaling
          maxFontSizeMultiplier={typeCap.content}
        >
          {en.tagline}
        </Text>
      </View>

      <Text
        style={[s.listLabel, fontFor('en', 'semibold'), { color: colors.inkSoft }]}
        allowFontScaling
        maxFontSizeMultiplier={typeCap.chrome}
      >
        {en.chooseLanguage.toUpperCase()}
      </Text>

      <ScrollView style={s.list} contentContainerStyle={s.listContent}>
        {LANGUAGES.map((language) => {
          const chosen = language.code === chosenCode;
          const chosenWord = t(language.code).chosen;
          return (
            <Pressable
              key={language.code}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(language);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: chosen }}
              accessibilityLabel={`${language.nativeName}. ${language.englishName}`}
              accessibilityLanguage={language.speechTag}
              style={({ pressed }) => [
                s.card,
                { backgroundColor: colors.white },
                chosen && [s.cardChosen, { borderColor: colors.mint }],
                pressed && s.pressed,
              ]}
            >
              {chosen ? (
                <LinearGradient
                  colors={[...gradients.selected.colors]}
                  locations={[...gradients.selected.locations]}
                  start={gradients.selected.start}
                  end={gradients.selected.end}
                  style={StyleSheet.absoluteFill}
                  importantForAccessibility="no"
                />
              ) : null}
              {chosen ? (
                <View style={[s.checkBadge, { backgroundColor: colors.ink }]} importantForAccessibility="no">
                  <CheckIcon size={15} color={colors.white} />
                </View>
              ) : null}
              <View style={s.rowText}>
                <Text
                  style={[s.native, serifFor(language.code, 'medium'), { color: colors.ink }]}
                  allowFontScaling
                  maxFontSizeMultiplier={typeCap.content}
                >
                  {language.nativeName}
                </Text>
                <Text style={[s.english, fontFor('en'), { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={typeCap.content}>
                  {language.englishName}
                </Text>
              </View>
              {chosen ? (
                <Text style={[s.chosenWord, fontFor(language.code, 'semibold'), { color: colors.accentText }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
                  {chosenWord}
                </Text>
              ) : (
                <View style={[s.chevronCircle, { backgroundColor: colors.cream }]} importantForAccessibility="no">
                  <ChevronForwardIcon size={14} color={colors.inkSoft} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SageBackground>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    titleBlock: { paddingHorizontal: 24, paddingTop: 8, gap: 6 },
    appName: { fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
    tagline: { fontSize: 20, lineHeight: 26, color: c.inkSoft, maxWidth: 240 },
    listLabel: { fontSize: 12, lineHeight: 16, letterSpacing: 1.2, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
    list: { flex: 1, minHeight: 0 },
    listContent: { gap: 10, paddingHorizontal: 16, paddingBottom: 40 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 96,
      paddingHorizontal: 24,
      paddingVertical: 24,
      borderRadius: radius.card,
      overflow: 'hidden',
      ...elevation.card,
    },
    cardChosen: { borderWidth: 1.5 },
    pressed: { opacity: 0.96 },
    checkBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, minWidth: 0 },
    native: { fontSize: 30, lineHeight: 33 },
    english: { fontSize: 14, lineHeight: 20, marginTop: 2 },
    chosenWord: { fontSize: 12, lineHeight: 16 },
    chevronCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  });
