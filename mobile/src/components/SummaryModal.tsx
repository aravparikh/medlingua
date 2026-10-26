import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import type { Turn } from '../screens/ConversationScreen';
import { fontFor, mono, serifFor, typeCap, useTheme, type ColorTokens } from '../theme';
import { ChevronForwardIcon, TimeIcon } from './icons';

const LIFETIME_S = 120;
const WARN_AT_S = 30;

export type SummaryState =
  | { status: 'loading' }
  | { status: 'ready'; text: string }
  | { status: 'error' };

interface Props {
  /** null = closed (the pushed screen stays mounted, per the push contract). */
  state: SummaryState | null;
  otherLanguage: Language;
  turns: Turn[];
  onBack: () => void;
  onTranscript: () => void;
  onClose: () => void;
}

const clockOf = (id: number) =>
  new Date(id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

/**
 * The ephemeral visit summary as a pushed screen on the summary ground
 * (#FDFCFA), not a bottom sheet. Same back row as the transcript, a meta
 * strip, scrolling sections, and an outlined TRANSCRIPCIÓN + filled COMPARTIR
 * footer. The 2:00 countdown is kept: when it ends the text is gone, which is
 * what keeps the "nothing is saved" promise.
 */
export function SummaryModal({ state, otherLanguage, turns, onBack, onTranscript, onClose }: Props) {
  const en = t('en');
  const other = t(otherLanguage.code);

  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [secondsLeft, setSecondsLeft] = useState(LIFETIME_S);
  const ready = state?.status === 'ready';

  // The countdown starts the moment the summary is readable and never pauses.
  // Same shape as the original bottom-sheet timer: reset on new content,
  // tick every second, expiry clears the summary upstream.
  useEffect(() => {
    if (!ready) return;
    setSecondsLeft(LIFETIME_S);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [ready, state]);

  // Expiry clears the summary upstream — the text only ever lived in state.
  useEffect(() => {
    if (ready && secondsLeft <= 0) onClose();
  }, [ready, secondsLeft, onClose]);

  const shareAll = async () => {
    if (state?.status !== 'ready') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: state.text });
    } catch {
      // The user backed out of the share sheet — nothing to do.
    }
  };

  const warn = secondsLeft <= WARN_AT_S;
  const mm = Math.floor(Math.max(secondsLeft, 0) / 60);
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, '0');

  const firstId = turns.length > 0 ? turns[0].id : Date.now();
  const lastId = turns.length > 0 ? turns[turns.length - 1].id : Date.now();
  const timeRange = useMemo(() => `${clockOf(firstId)} – ${clockOf(lastId)}`, [firstId, lastId]);
  const parsed = useMemo(
    () => (state?.status === 'ready' ? parseSummary(state.text) : null),
    [state],
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.summaryBg, paddingTop: insets.top }]}>
      <View style={[s.topRow, { borderBottomColor: colors.hairline }]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={`${other.back}. ${en.back}`}
          style={({ pressed }) => [s.back, pressed && s.pressed]}
        >
          <View style={s.backChevron}>
            <ChevronForwardIcon size={12} color={colors.ink} />
          </View>
          <Text style={[s.backLabel, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.back.toUpperCase()}
          </Text>
        </Pressable>
        <Text
          style={[s.title, serifFor(otherLanguage.code), { color: colors.ink }]}
          accessibilityRole="header"
          accessibilityLanguage={otherLanguage.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={typeCap.chrome}
        >
          {other.summary}
        </Text>
        <Text style={[s.side, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
          {en.summary.toUpperCase()}
        </Text>
      </View>

      <View style={[s.meta, { borderBottomColor: colors.hairline }]}>
        <View style={s.metaCol}>
          <Text style={[s.metaLabel, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.appointmentLabel.toUpperCase()}
          </Text>
          <Text style={[s.metaValue, serifFor(otherLanguage.code), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {otherLanguage.nativeName}
          </Text>
        </View>
        <View style={s.metaCol}>
          <Text style={[s.metaLabel, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.timeLabel.toUpperCase()}
          </Text>
          <Text style={[s.metaMono, { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {timeRange}
          </Text>
        </View>
        <View style={s.metaColNarrow}>
          <Text style={[s.metaLabel, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.turnsLabel.toUpperCase()}
          </Text>
          <Text style={[s.metaMono, { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {turns.length}
          </Text>
        </View>
      </View>

      {ready ? (
        <View style={[s.timer, warn && { backgroundColor: colors.danger }]}>
          <TimeIcon size={16} color={warn ? colors.bg : colors.ink} />
          <Text style={[s.timerText, fontFor(otherLanguage.code), warn && { color: colors.bg }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.summaryEphemeral}
          </Text>
          <Text style={[s.timerClock, warn && { color: colors.bg }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {`${mm}:${ss}`}
          </Text>
        </View>
      ) : null}

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        {state?.status === 'loading' ? (
          <Text style={[s.loadingText, fontFor(otherLanguage.code, 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.generatingSummary}
          </Text>
        ) : null}
        {state?.status === 'error' ? (
          <Text style={[s.loadingText, fontFor(otherLanguage.code, 'semibold'), { color: colors.danger }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.connectionError}
          </Text>
        ) : null}
        {parsed ? (
          <>
            <View style={[s.section, { borderBottomColor: colors.rule }]}>
              <View style={s.sectionHead}>
                <Text style={[s.numeral, { color: colors.ink2 }]}>01</Text>
                <Text style={[s.sectionTitle, serifFor(otherLanguage.code), { color: colors.ink }]}>{other.reasonLabel}</Text>
                <Text style={[s.sectionEn, fontFor('en', 'semibold'), { color: colors.ink2 }]}>{en.reasonLabel.toUpperCase()}</Text>
              </View>
              <Text style={[s.lede, serifFor(otherLanguage.code), { color: colors.ink }]}>{parsed.lede}</Text>
            </View>
            <View style={[s.section, { borderBottomColor: colors.rule }]}>
              <View style={s.sectionHead}>
                <Text style={[s.numeral, { color: colors.ink2 }]}>02</Text>
                <Text style={[s.sectionTitle, serifFor(otherLanguage.code), { color: colors.ink }]}>{other.symptomsLabel}</Text>
                <Text style={[s.sectionEn, fontFor('en', 'semibold'), { color: colors.ink2 }]}>{en.symptomsLabel.toUpperCase()}</Text>
              </View>
              <View style={s.bullets}>
                {parsed.patientBullets.map((line, i) => (
                  <View key={i} style={s.bullet}>
                    <View style={[s.dot, { backgroundColor: colors.ctaFill }]} />
                    <View style={s.bulletText}>
                      <Text style={[s.bulletPrimary, fontFor(otherLanguage.code), { color: colors.ink }]}>{line}</Text>
                      {parsed.englishBullets[i] ? (
                        <Text style={[s.bulletSecondary, fontFor('en'), { color: colors.ink2 }]}>{parsed.englishBullets[i]}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
            {parsed.extraBullets.length > 0 ? (
              <View style={[s.section, { borderBottomColor: colors.rule }]}>
                <View style={s.sectionHead}>
                  <Text style={[s.numeral, { color: colors.ink2 }]}>03</Text>
                  <Text style={[s.sectionTitle, serifFor(otherLanguage.code), { color: colors.ink }]}>{other.nextStepsLabel}</Text>
                  <Text style={[s.sectionEn, fontFor('en', 'semibold'), { color: colors.ink2 }]}>{en.nextStepsLabel.toUpperCase()}</Text>
                </View>
                <View style={s.bullets}>
                  {parsed.extraBullets.map((line, i) => (
                    <View key={i} style={s.bullet}>
                      <View style={[s.dot, { backgroundColor: colors.ctaFill }]} />
                      <View style={s.bulletText}>
                        <Text style={[s.bulletPrimary, fontFor(otherLanguage.code), { color: colors.ink }]}>{line}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            <Text style={[s.disclaimer, fontFor(otherLanguage.code), { color: colors.ink2 }]}>{`${other.summaryDisclaimer} · ${en.summaryDisclaimer}`}</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={[s.footer, { borderTopColor: colors.hairline }]}>
        <Pressable
          onPress={onTranscript}
          accessibilityRole="button"
          accessibilityLabel={`${other.transcriptTitle}. ${en.transcriptTitle}`}
          style={({ pressed }) => [s.outlineButton, { borderColor: colors.border }, pressed && s.pressed]}
        >
          <Text style={[s.footerLabel, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.transcriptTitle.toUpperCase()}
          </Text>
        </Pressable>
        <Pressable
          onPress={shareAll}
          accessibilityRole="button"
          accessibilityLabel={`${other.share}. ${en.share}`}
          style={({ pressed }) => [s.filledButton, { backgroundColor: colors.ctaFill, borderColor: colors.ctaFill }, pressed && s.pressedFill]}
        >
          <Text style={[s.footerLabel, fontFor('en', 'semibold'), { color: colors.onCta }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.share.toUpperCase()}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * The service returns bilingual freeform text (patient half, then English
 * half) with "• " bullets. Map it onto the paper sections without dropping
 * anything: first paragraph → 01 lede, patient bullets paired with English
 * bullets → 02 rows, anything unpaired → 03.
 */
function parseSummary(text: string): { lede: string; patientBullets: string[]; englishBullets: string[]; extraBullets: string[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets = lines
    .filter((l) => l.startsWith('•'))
    .map((l) => l.replace(/^•\s*/, '').trim())
    .filter((l) => l && l !== '—' && l !== '-');
  const paras = lines.filter((l) => !l.startsWith('•'));
  const mid = Math.ceil(bullets.length / 2);
  const patientPool = bullets.slice(0, mid);
  const englishPool = bullets.slice(mid);
  const rows = Math.min(patientPool.length, englishPool.length);
  const patientBullets = rows > 0 ? patientPool.slice(0, rows) : patientPool;
  const englishBullets = englishPool.slice(0, patientBullets.length);
  const extraBullets = patientPool.slice(patientBullets.length).concat(englishPool.slice(patientBullets.length));
  const first = paras.length > 0 ? paras[0] : '';
  const lede = first.replace(/^(Motivo|Reason)\s*[:–-]\s*/i, '').trim() || first;
  return { lede, patientBullets, englishBullets, extraBullets };
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    back: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48 },
    backChevron: { transform: [{ rotate: '180deg' }] },
    backLabel: { fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 },
    title: { flex: 1, fontSize: 17, lineHeight: 22, textAlign: 'center' },
    side: { flex: 1, fontSize: 9.5, lineHeight: 13, letterSpacing: 1.1, textAlign: 'right' },
    meta: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1 },
    metaCol: { flex: 1.3, minWidth: 0 },
    metaColNarrow: { flex: 0.5, minWidth: 0 },
    metaLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 1.3 },
    metaValue: { fontSize: 14, lineHeight: 19, marginTop: 3 },
    metaMono: { fontFamily: mono, fontWeight: '500', fontSize: 11, lineHeight: 15, marginTop: 5 },
    timer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.rule },
    timerText: { flex: 1, fontSize: 12, lineHeight: 17 },
    timerClock: { fontFamily: mono, fontWeight: '500', fontSize: 12, color: c.ink },
    body: { flex: 1, minHeight: 0 },
    bodyContent: { paddingHorizontal: 24, paddingBottom: 20 },
    loadingText: { fontSize: 13, lineHeight: 19, marginTop: 16 },
    section: { paddingVertical: 16, borderBottomWidth: 1 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
    numeral: { fontFamily: mono, fontWeight: '500', fontSize: 10 },
    sectionTitle: { flex: 1, fontSize: 18, lineHeight: 24 },
    sectionEn: { fontSize: 9.5, lineHeight: 13, letterSpacing: 1.1 },
    lede: { fontSize: 18, lineHeight: 25.2, marginTop: 10 },
    bullets: { marginTop: 10, gap: 10 },
    bullet: { flexDirection: 'row', gap: 10 },
    dot: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
    bulletText: { flex: 1, minWidth: 0 },
    bulletPrimary: { fontSize: 13, lineHeight: 18.2 },
    bulletSecondary: { fontSize: 11.5, lineHeight: 16.7, marginTop: 2 },
    disclaimer: { fontSize: 10.5, lineHeight: 15.8, marginTop: 14, marginBottom: 4 },
    footer: { flexDirection: 'row', gap: 9, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
    outlineButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 4, padding: 12, minHeight: 48 },
    filledButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 4, padding: 12, minHeight: 48 },
    footerLabel: { fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 },
    pressed: { backgroundColor: 'rgba(29, 28, 26, 0.04)' },
    pressedFill: { opacity: 0.9 },
  });
