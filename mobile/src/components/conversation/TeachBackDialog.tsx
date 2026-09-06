import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, elevation, radius, spacing, tapTarget, useTheme } from '../../theme';
import { AlertCircleIcon, CheckIcon, CloseIcon, PeopleIcon, ShieldIcon, SpeakIcon, UnderstandIcon } from '../icons';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';

export interface TeachState {
  stage: 'loading' | 'ask' | 'loading2' | 'ask2' | 'failed' | 'error';
  text?: string;
  source?: string;
}

interface Props {
  teach: TeachState | null;
  otherLanguage: Language;
  onClose: () => void;
  onReplay: () => void;
  onAnswer: (understood: boolean) => void;
  onShowRights: () => void;
}

/** Teach-back: the clinician's message re-explained simply, then "did you understand?" */
export function TeachBackDialog({ teach, otherLanguage, onClose, onReplay, onAnswer, onShowRights }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  if (!teach) return null;
  const lang = otherLanguage.code;
  const tag = otherLanguage.speechTag;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.bg }, elevation.sheet]}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close}. ${en.close}`}
            style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.surfacePressed }]}
          >
            <CloseIcon size={24} color={colors.ink} />
          </Pressable>

          {teach.stage === 'loading' || teach.stage === 'loading2' ? (
            <View style={styles.center} accessibilityLiveRegion="polite">
              <UnderstandIcon size={32} color={colors.ink2} />
              <Label {...bilingual(other.simplifying, en.simplifying)} lang={lang} speechTag={tag} tone="ink2" align="center" />
            </View>
          ) : null}

          {teach.stage === 'ask' || teach.stage === 'ask2' ? (
            <View style={styles.stack}>
              {teach.stage === 'ask2' ? (
                <Label primary={en.explainAgain} lang="en" size="caption" tone="ink2" />
              ) : null}
              <Label primary={teach.text ?? ''} lang={lang} speechTag={tag} size="title" weight="semibold" />
              <Button
                label={bilingual(other.playAgain, en.playAgain)}
                lang={lang}
                speechTag={tag}
                variant="quiet"
                icon={<SpeakIcon size={20} color={colors.ink} />}
                onPress={onReplay}
              />
              <Label {...bilingual(other.didYouUnderstand, en.didYouUnderstand)} lang={lang} speechTag={tag} weight="semibold" align="center" />
              <View style={styles.choices}>
                <Button label={bilingual(other.yes, en.yes)} lang={lang} speechTag={tag} variant="accent" size="primary" flex icon={<CheckIcon size={28} color={colors.onAccent} />} onPress={() => onAnswer(true)} />
                <Button label={bilingual(other.no, en.no)} lang={lang} speechTag={tag} variant="ink" size="primary" flex icon={<CloseIcon size={28} color={colors.bg} />} onPress={() => onAnswer(false)} />
              </View>
            </View>
          ) : null}

          {teach.stage === 'failed' ? (
            <View style={styles.center} accessibilityLiveRegion="assertive">
              <PeopleIcon size={32} color={colors.ink} />
              <Label {...bilingual(other.askInterpreter, en.askInterpreter)} lang={lang} speechTag={tag} weight="semibold" align="center" />
              <Button
                label={bilingual(other.rightsShow, en.rightsShow)}
                lang={lang}
                speechTag={tag}
                variant="accent"
                size="primary"
                icon={<ShieldIcon size={22} color={colors.onAccent} />}
                onPress={onShowRights}
              />
            </View>
          ) : null}

          {teach.stage === 'error' ? (
            <View style={styles.center} accessibilityLiveRegion="assertive">
              <AlertCircleIcon size={32} color={colors.danger} />
              <Label {...bilingual(other.connectionError, en.connectionError)} lang={lang} speechTag={tag} tone="danger" align="center" />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: radius.sheet, padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md },
  close: { position: 'absolute', top: spacing.xs, right: spacing.xs, width: tapTarget.min, height: tapTarget.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, zIndex: 1 },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  stack: { gap: spacing.md },
  choices: { flexDirection: 'row', gap: spacing.sm },
});
