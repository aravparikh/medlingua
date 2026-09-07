import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronBackIcon, ChevronForwardIcon, InfoIcon, LinkIcon, LockIcon, ShieldIcon } from '../components/icons';

import type { Language } from '../config/languages';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../config/links';
import { t } from '../i18n/strings';
import { loadPrefs, savePrefs } from '../services/storage';
import { bilingual, fontFor, radius, serifFor, spacing, tapTarget, text, useTheme, type ColorTokens } from '../theme';
import { Label } from '../components/ui/Label';
import { PressableScale } from '../components/PressableScale';
import { RightsCard } from '../components/RightsCard';

interface Props {
  otherLanguage: Language;
  onBack: () => void;
}

/** One small screen: what the app does and that nothing is stored, shown in
 * the selected language first with English below. */
export function AboutScreen({ otherLanguage, onBack }: Props) {
  const other = t(otherLanguage.code);
  const en = t('en');
  const [rightsOpen, setRightsOpen] = useState(false);
  // Written straight to prefs. The conversation screen unmounts while this one
  // is open, so it picks both up when it remounts on the way back.
  const [speakAloud, setSpeakAloud] = useState(() => loadPrefs().speakAloud ?? true);
  const [voiceInput, setVoiceInput] = useState(() => loadPrefs().voiceInput ?? true);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const toggle = (
    key: 'speakAloud' | 'voiceInput',
    on: boolean,
    setOn: (next: boolean) => void,
    label: { primary: string; secondary?: string },
    hint: { primary: string; secondary?: string },
  ) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setOn(!on);
        savePrefs({ [key]: !on });
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${label.primary}. ${label.secondary ?? ''} ${hint.primary}`}
      style={({ pressed }) => [styles.settingRow, { borderBottomColor: colors.rule }, pressed && styles.pressedFill]}
    >
      <View style={styles.settingText}>
        <Label primary={label.primary} secondary={label.secondary} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} weight="semibold" />
        <Label primary={hint.primary} secondary={hint.secondary} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="caption" tone="ink2" />
      </View>
      <View style={[styles.track, { borderColor: on ? colors.ctaFill : colors.border, backgroundColor: on ? colors.ctaFill : 'transparent' }]}>
        <View style={[styles.knob, { backgroundColor: on ? colors.onCta : colors.ink2 }, on && styles.knobOn]} />
      </View>
    </Pressable>
  );

  const backLabel = bilingual(other.back, en.back);
  const rightsLabel = bilingual(other.rightsShow, en.rightsShow);
  const privacyLabel = bilingual(other.privacyPolicy, en.privacyPolicy);
  const termsLabel = bilingual(other.termsLabel, en.termsLabel);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={`${other.back}. ${en.back}`}
        style={({ pressed }) => [styles.back, pressed && styles.pressedFill]}
      >
        <ChevronBackIcon size={24} color={colors.ink} />
        <Label
          primary={backLabel.primary}
          secondary={backLabel.secondary}
          lang={otherLanguage.code}
          speechTag={otherLanguage.speechTag}
          size="caption"
          weight="semibold"
        />
      </Pressable>

      <Text style={[text.label, fontFor('en', 'semibold'), styles.settingsHeading, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.6}>
        {other.settingsTitle.toUpperCase()}
      </Text>
      <View style={[styles.settings, { borderTopColor: colors.hairline }]}>
        {toggle('speakAloud', speakAloud, setSpeakAloud, bilingual(other.speakAloudLabel, en.speakAloudLabel), bilingual(other.speakAloudHint, en.speakAloudHint))}
        {toggle('voiceInput', voiceInput, setVoiceInput, bilingual(other.voiceInputLabel, en.voiceInputLabel), bilingual(other.voiceInputHint, en.voiceInputHint))}
      </View>

      <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header">
        MedLingua
      </Text>

      {/* One tap to the interpreter-rights card — the screen made to be
         handed to staff. Most patients don't know this right exists, so it
         gets the only ink fill on the page. */}
      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setRightsOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${other.rightsShow}. ${en.rightsShow}. ${other.rightsTitle}`}
        style={styles.rightsEntry}
      >
        <ShieldIcon size={28} color={colors.bg} />
        <Label
          primary={rightsLabel.primary}
          secondary={rightsLabel.secondary}
          lang={otherLanguage.code}
          speechTag={otherLanguage.speechTag}
          weight="semibold"
          tone="onInk"
          style={styles.rightsLabel}
        />
        <ChevronForwardIcon size={26} color={colors.bg} />
      </PressableScale>

      <View style={styles.card}>
        <Text
          style={[styles.heading, fontFor(otherLanguage.code, 'semibold')]}
          allowFontScaling
          maxFontSizeMultiplier={2}
          accessibilityLanguage={otherLanguage.speechTag}
        >
          {other.about}
        </Text>
        <Text
          style={[styles.body, fontFor(otherLanguage.code)]}
          allowFontScaling
          maxFontSizeMultiplier={2}
          accessibilityLanguage={otherLanguage.speechTag}
        >
          {other.aboutBody}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.heading, fontFor('en', 'semibold')]} allowFontScaling maxFontSizeMultiplier={2}>
          {en.about}
        </Text>
        <Text style={[styles.body, fontFor('en')]} allowFontScaling maxFontSizeMultiplier={2}>
          {en.aboutBody}
        </Text>
      </View>

      {/* The AI disclaimer is a caution, so it is drawn as one — the only
         non-neutral card on the page. */}
      <View style={styles.cautionCard}>
        <InfoIcon size={22} color={colors.caution} />
        <View style={styles.noticeBody}>
          <Text
            style={[styles.noticeText, fontFor(otherLanguage.code, 'semibold')]}
            allowFontScaling
            maxFontSizeMultiplier={2}
            accessibilityLanguage={otherLanguage.speechTag}
          >
            {other.aiDisclaimer}
          </Text>
          <Text style={[styles.noticeTextEn, fontFor('en')]} allowFontScaling maxFontSizeMultiplier={2}>
            {en.aiDisclaimer}
          </Text>
          <Text
            style={[styles.noticeText, fontFor(otherLanguage.code, 'semibold')]}
            allowFontScaling
            maxFontSizeMultiplier={2}
            accessibilityLanguage={otherLanguage.speechTag}
          >
            {other.dataConsent}
          </Text>
          <Text style={[styles.noticeTextEn, fontFor('en')]} allowFontScaling maxFontSizeMultiplier={2}>
            {en.dataConsent}
          </Text>
        </View>
      </View>

      <View style={styles.noticeCard}>
        <LockIcon size={22} color={colors.ink} />
        <View style={styles.noticeBody}>
          <Text
            style={[styles.noticeText, fontFor(otherLanguage.code, 'semibold')]}
            allowFontScaling
            maxFontSizeMultiplier={2}
            accessibilityLanguage={otherLanguage.speechTag}
          >
            {other.privacyLine}
          </Text>
          <Text style={[styles.noticeTextEn, fontFor('en')]} allowFontScaling maxFontSizeMultiplier={2}>
            {en.privacyLine}
          </Text>
        </View>
      </View>

      <View style={styles.legalRow}>
        <Pressable
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`${other.privacyPolicy}. ${en.privacyPolicy}`}
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressedFill]}
        >
          <LinkIcon size={18} color={colors.ink2} />
          <Label
            primary={privacyLabel.primary}
            secondary={privacyLabel.secondary}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            size="caption"
            weight="semibold"
            numberOfLines={2}
          />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`${other.termsLabel}. ${en.termsLabel}`}
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressedFill]}
        >
          <LinkIcon size={18} color={colors.ink2} />
          <Label
            primary={termsLabel.primary}
            secondary={termsLabel.secondary}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            size="caption"
            weight="semibold"
            numberOfLines={2}
          />
        </Pressable>
      </View>

      <RightsCard visible={rightsOpen} otherLanguage={otherLanguage} onClose={() => setRightsOpen(false)} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    settingsHeading: { marginTop: spacing.lg, marginBottom: spacing.xs },
    settings: { borderTopWidth: StyleSheet.hairlineWidth },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: tapTarget.primary,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingText: { flex: 1, gap: 2 },
    track: { width: 46, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 3 },
    knob: { width: 20, height: 20, borderRadius: 10 },
    knobOn: { alignSelf: 'flex-end' },
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    back: {
      alignSelf: 'flex-start',
      minHeight: tapTarget.min,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      paddingRight: spacing.sm,
      borderRadius: radius.pill,
    },
    pressedFill: {
      backgroundColor: c.surfacePressed,
    },
    title: {
      ...text.heading,
      ...serifFor('en'),
      color: c.ink,
    },
    rightsEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.ink,
      borderRadius: radius.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: tapTarget.primary,
    },
    rightsLabel: {
      flex: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    heading: {
      ...text.body,
      color: c.ink,
    },
    body: {
      ...text.body,
      lineHeight: text.body.fontSize * 1.5,
      color: c.ink,
    },
    cautionCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: c.cautionBg,
      borderRadius: radius.card,
      padding: spacing.lg,
    },
    noticeCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.card,
      padding: spacing.lg,
    },
    noticeBody: {
      flex: 1,
      gap: spacing.xxs,
    },
    noticeText: {
      ...text.caption,
      lineHeight: text.caption.fontSize * 1.45,
      color: c.ink,
    },
    noticeTextEn: {
      ...text.caption,
      lineHeight: text.caption.fontSize * 1.45,
      color: c.ink2,
    },
    legalRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    legalLink: {
      flex: 1,
      minHeight: tapTarget.min,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: c.bg,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
  });
