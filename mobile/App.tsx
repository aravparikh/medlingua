import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AudioModule } from 'expo-audio';
import { useFonts } from 'expo-font';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  NotoSansGurmukhi_400Regular,
  NotoSansGurmukhi_600SemiBold,
  NotoSansGurmukhi_700Bold,
} from '@expo-google-fonts/noto-sans-gurmukhi';
// Simplified Chinese deliberately uses the system CJK face (PingFang SC / Noto
// Sans CJK): bundling Noto Sans SC costs 30 MB for three weights. See theme.ts.

import { getLanguage, type Language } from './src/config/languages';
import { loadPrefs, savePrefs } from './src/services/storage';
import { spacing, text, useTheme, type ColorTokens } from './src/theme';
import { Appear } from './src/components/Appear';
import { AboutScreen } from './src/screens/AboutScreen';
import { ConversationScreen, type Escalation, type Turn } from './src/screens/ConversationScreen';
import { LanguageSelectScreen } from './src/screens/LanguageSelectScreen';

type Screen = 'languages' | 'conversation' | 'about';

/**
 * Deliberately no navigation library: four full-screen views and one state
 * switch keeps the app small, fast, and predictable for its audience. The
 * `Appear` wrapper (keyed by screen) gives a gentle fade-and-rise transition.
 */
export default function App() {
  // Every script cut loads here, once, behind the splash — never per screen.
  const [fontsLoaded, fontError] = useFonts({
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
    NotoSansGurmukhi_400Regular,
    NotoSansGurmukhi_600SemiBold,
    NotoSansGurmukhi_700Bold,
  });

  const { scheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // No onboarding by design: the native-script language rows are the
  // onboarding, and they need zero English to use.
  const [prefs] = useState(loadPrefs);
  const [screen, setScreen] = useState<Screen>('languages');
  const [otherLanguage, setOtherLanguage] = useState<Language | null>(() => {
    try {
      return prefs.languageCode ? getLanguage(prefs.languageCode) : null;
    } catch {
      return null;
    }
  });
  // The visit transcript lives here (not in the conversation screen) so a trip
  // to the About screen doesn't wipe it. Memory only — never written to disk.
  const [turns, setTurns] = useState<Turn[]>([]);
  // Utterances the confidence gate gave up on. Held next to the transcript and
  // on the same terms: memory only, wiped with it, appended to the summary so
  // the clinician can see what never made it across.
  const [escalations, setEscalations] = useState<Escalation[]>([]);

  const selectLanguage = (language: Language) => {
    setOtherLanguage(language);
    setTurns([]);
    setEscalations([]);
    savePrefs({ languageCode: language.code });
    setScreen('conversation');
    // Ask for the microphone now, at a calm moment — not mid-gesture during
    // someone's first hold-to-talk, which would cancel their press.
    AudioModule.requestRecordingPermissionsAsync().catch(() => {});
  };

  // Brief branded loading state while fonts arrive (system fonts on failure).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.splashText}>MedLingua</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Appear key={screen} style={styles.root}>
          {screen === 'languages' && <LanguageSelectScreen onSelect={selectLanguage} />}
          {screen === 'conversation' && otherLanguage && (
            <ConversationScreen
              otherLanguage={otherLanguage}
              turns={turns}
              onTurnsChange={setTurns}
              escalations={escalations}
              onEscalation={(escalation) => setEscalations((prev) => [...prev, escalation])}
              onChangeLanguage={() => setScreen('languages')}
              onShowAbout={() => setScreen('about')}
            />
          )}
          {screen === 'about' && otherLanguage && (
            <AboutScreen otherLanguage={otherLanguage} onBack={() => setScreen('conversation')} />
          )}
        </Appear>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    splash: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    // Fonts aren't loaded yet on the splash — system font on purpose.
    splashText: { ...text.body, color: c.ink, fontWeight: '700' },
  });
