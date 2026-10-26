import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CloseIcon, SealMark } from './icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { fontFor, radius, serifFor, spacing, tapTarget, text, typeCap, useTheme, type ColorTokens } from '../theme';

interface Props {
  visible: boolean;
  otherLanguage: Language;
  onClose: () => void;
}

/**
 * The interpreter-rights card. Title VI of the Civil Rights Act and §1557 of
 * the ACA entitle every patient to a free, qualified medical interpreter —
 * and most patients don't know it. This screen exists to be handed to staff,
 * so it is drawn like a document: a double-rule frame and a seal mark, made
 * to photograph like something official. Patient language first and large,
 * English below, fully static and offline.
 */
export function RightsCard({ visible, otherLanguage, onClose }: Props) {
  const en = t('en');
  const other = t(otherLanguage.code);

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          {/* Chrome, so the label rule applies — and a close is the one
             control where the glyph outperforms either language. The name
             lives in the accessibility label instead, in both. */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close}. ${en.close}`}
            style={({ pressed }) => [styles.close, pressed && styles.pressedFill]}
          >
            <CloseIcon size={24} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* The document: double-rule frame, seal on top — certificate grammar. */}
          <View style={styles.frameOuter}>
            <View style={styles.frameInner}>
              <SealMark size={56} color={colors.ink} style={styles.seal} />
              <Text
                style={[styles.title, serifFor(otherLanguage.code)]}
                allowFontScaling
                maxFontSizeMultiplier={typeCap.content}
                accessibilityRole="header"
                accessibilityLanguage={otherLanguage.speechTag}
              >
                {other.rightsTitle}
              </Text>
              <Text
                style={[styles.body, fontFor(otherLanguage.code)]}
                allowFontScaling
                maxFontSizeMultiplier={typeCap.content}
                accessibilityLanguage={otherLanguage.speechTag}
              >
                {other.rightsBody}
              </Text>

              <View style={styles.divider} importantForAccessibility="no" />

              <Text style={styles.titleEn} allowFontScaling maxFontSizeMultiplier={typeCap.content}>
                {en.rightsTitle}
              </Text>
              <Text style={styles.bodyEn} allowFontScaling maxFontSizeMultiplier={typeCap.content}>
                {en.rightsBody}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
      paddingTop: spacing.xl,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.md,
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
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    frameOuter: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: radius.sheet,
      padding: spacing.xxs,
      backgroundColor: c.surface,
    },
    frameInner: {
      borderWidth: 1,
      borderColor: c.rule,
      // Concentric with the outer frame: inner = outer radius − the gap
      // between them, which is exactly the card radius.
      borderRadius: radius.card,
      backgroundColor: c.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    seal: {
      alignSelf: 'center',
    },
    title: {
      ...text.heading,
      color: c.ink,
      textAlign: 'center',
    },
    body: {
      ...text.body,
      lineHeight: text.body.fontSize * 1.5,
      color: c.ink,
    },
    divider: {
      height: 1,
      backgroundColor: c.rule,
      marginVertical: spacing.xs,
    },
    titleEn: {
      ...text.title,
      ...fontFor('en', 'semibold'),
      color: c.ink2,
    },
    bodyEn: {
      ...text.caption,
      ...fontFor('en'),
      lineHeight: text.caption.fontSize * 1.5,
      color: c.ink2,
    },
  });
