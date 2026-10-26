import { ScrollView, StyleSheet, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import type { MedLabelResult } from '../../services/openai';
import { bilingual, spacing, useTheme } from '../../theme';
import { BrandGlyph, InfoIcon, MedkitIcon, RefreshIcon, SpeakIcon } from '../icons';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Sheet } from './Sheet';

export type ScanState =
  | { status: 'loading' }
  | { status: 'ready'; result: MedLabelResult }
  | { status: 'unreadable' }
  | { status: 'permission' }
  | { status: 'error' };

interface Props {
  scan: ScanState | null;
  otherLanguage: Language;
  speakDisabled: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSpeak: () => void;
}

/**
 * Medication label result. On the tokens now so this file migrates with the
 * conversation view; its own design pass is the "OCR result" step.
 */
export function ScanSheet({ scan, otherLanguage, speakDisabled, onClose, onRetry, onSpeak }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  if (!scan) return null;
  const lang = otherLanguage.code;
  const tag = otherLanguage.speechTag;

  const errorText =
    scan.status === 'unreadable'
      ? bilingual(other.scanUnreadable, en.scanUnreadable)
      : scan.status === 'permission'
        ? bilingual(other.cameraPermission, en.cameraPermission)
        : bilingual(other.connectionError, en.connectionError);

  return (
    <Sheet visible onClose={onClose} title={bilingual(other.scanTitle, en.scanTitle)} otherLanguage={otherLanguage} icon={<MedkitIcon size={24} color={colors.ink} />}>
      {scan.status === 'loading' ? (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <Label {...bilingual(other.scanReading, en.scanReading)} lang={lang} speechTag={tag} tone="ink2" align="center" />
        </View>
      ) : null}

      {scan.status === 'unreadable' || scan.status === 'permission' || scan.status === 'error' ? (
        <View style={styles.center} accessibilityLiveRegion="assertive">
          <BrandGlyph name={scan.status === 'permission' ? 'camera-outline' : 'alert-circle'} size={32} color={colors.danger} />
          <Label {...errorText} lang={lang} speechTag={tag} tone="danger" weight="semibold" align="center" />
          {scan.status !== 'permission' ? (
            <Button label={bilingual(other.tryAgain, en.tryAgain)} lang={lang} speechTag={tag} variant="danger" icon={<RefreshIcon size={20} color={colors.danger} />} onPress={onRetry} />
          ) : null}
        </View>
      ) : null}

      {scan.status === 'ready' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Label primary={scan.result.name} lang="en" size="heading" weight="bold" />
          {(
            [
              { label: bilingual(other.scanDose, en.scanDose), pair: scan.result.howMuch, icon: 'water-outline' },
              { label: bilingual(other.scanWhen, en.scanWhen), pair: scan.result.when, icon: 'time-outline' },
              { label: bilingual(other.scanWarnings, en.scanWarnings), pair: scan.result.warnings, icon: 'warning-outline' },
            ] as const
          )
            .filter((section) => section.pair.other || section.pair.en)
            .map((section) => (
              <View key={section.label.primary} style={[styles.section, { borderTopColor: colors.rule }]}>
                <View style={styles.sectionHead}>
                  <BrandGlyph name={section.icon} size={18} color={colors.ink2} importantForAccessibility="no" />
                  <Label {...section.label} lang={lang} speechTag={tag} size="caption" tone="ink2" weight="semibold" />
                </View>
                <Label {...bilingual(section.pair.other, section.pair.en)} lang={lang} speechTag={tag} size="title" />
              </View>
            ))}

          <Button
            label={bilingual(other.speakAloud, en.speakAloud)}
            lang={lang}
            speechTag={tag}
            variant="accent"
            size="primary"
            icon={<SpeakIcon size={24} color={colors.onAccent} />}
            onPress={onSpeak}
            disabled={speakDisabled}
          />
          <View style={styles.note}>
            <InfoIcon size={18} color={colors.ink2} />
            <Label {...bilingual(other.pharmacistLine, en.pharmacistLine)} lang={lang} speechTag={tag} size="caption" tone="ink2" style={styles.noteText} />
          </View>
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  section: { gap: spacing.xs, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  noteText: { flex: 1 },
});
