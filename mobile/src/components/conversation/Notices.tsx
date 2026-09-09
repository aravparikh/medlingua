import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, fontFor, ROLE_EDGE_WIDTH, roles, spacing, text, useTheme } from '../../theme';
import { PeopleIcon, RefreshIcon, ShieldIcon, SpeakIcon } from '../icons';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';

type Role = keyof typeof roles;

/** Shared frame: a role edge on the left, content to the right. Tinted notices
 *  are cards (radius 20), never pills — a 999 radius on a tall banner curves
 *  the text straight off its ends. */
function Edged({ role, tint, children }: { role: Role | 'danger'; tint?: string; children: ReactNode }) {
  const { colors } = useTheme();
  const edge = role === 'danger' ? colors.danger : colors[roles[role].edge];
  return (
    <View style={[styles.edged, { borderLeftColor: edge }, tint ? { backgroundColor: tint, borderRadius: 20 } : null]}>
      {children}
    </View>
  );
}

interface TranslatingProps {
  stage: 'translating' | 'checking';
  role: Role;
  otherLanguage: Language;
}

/**
 * The waiting state. A still caption where the live line will land, and for
 * the safeguard's second step, a two-segment track: translate → verify. The
 * extra seconds should read as a second piece of work, because they are.
 */
export function Translating({ stage, role, otherLanguage }: TranslatingProps) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  const checking = stage === 'checking';
  return (
    <Edged role={role}>
      <View style={styles.translating} accessibilityLiveRegion="polite">
        <Label
          {...bilingual(checking ? other.gateChecking : other.translating, checking ? en.gateChecking : en.translating)}
          lang={otherLanguage.code}
          speechTag={otherLanguage.speechTag}
          tone="ink2"
        />
        <View style={styles.steps} importantForAccessibility="no">
          <View style={[styles.step, { backgroundColor: colors.ink2 }]} />
          <View style={[styles.step, { backgroundColor: checking ? colors.accent : colors.rule }]} />
        </View>
      </View>
    </Edged>
  );
}

interface HeldProps {
  stage: 'block' | 'escalate';
  speaker: Language;
  otherLanguage: Language;
  onSayAgain: () => void;
  onShowRights: () => void;
}

/** The gate withheld a translation. The text is never rendered — only a way forward. */
export function HeldNotice({ stage, speaker, otherLanguage, onSayAgain, onShowRights }: HeldProps) {
  const { colors } = useTheme();
  const en = t('en');
  const s = t(speaker.code);
  const other = t(otherLanguage.code);
  const escalate = stage === 'escalate';
  return (
    <Edged role="danger" tint={colors.dangerBg}>
      <View style={styles.noticeBody} accessibilityLiveRegion="assertive">
        <View style={styles.noticeHead}>
          {escalate ? <PeopleIcon size={20} color={colors.danger} /> : <RefreshIcon size={20} color={colors.danger} />}
          <Label
            primary={escalate ? s.gateEscalateTitle : s.gateBlockTitle}
            lang={speaker.code}
            speechTag={speaker.speechTag}
            tone="danger"
            weight="semibold"
          />
        </View>
        <Label
          {...bilingual(escalate ? s.gateEscalateBody : s.gateBlockBody, escalate ? en.gateEscalateBody : en.gateBlockBody)}
          lang={speaker.code}
          speechTag={speaker.speechTag}
          size="caption"
          tone="danger"
        />
        {escalate ? (
          <Button
            label={bilingual(other.rightsShow, en.rightsShow)}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            variant="danger"
            icon={<ShieldIcon size={20} color={colors.danger} />}
            onPress={onShowRights}
          />
        ) : (
          <Button
            label={bilingual(s.gateSayAgain, en.gateSayAgain)}
            lang={speaker.code}
            speechTag={speaker.speechTag}
            variant="danger"
            icon={<SpeakIcon size={20} color={colors.danger} />}
            onPress={onSayAgain}
          />
        )}
      </View>
    </Edged>
  );
}

interface ErrorProps {
  primary: string;
  secondary: string;
  otherLanguage: Language;
  /** Dev-only underlying cause; never shown in release. */
  detail?: string | null;
  onRetry?: () => void;
  retryDisabled?: boolean;
}

/** Something failed. Says what, in the patient's language first, and what to do. */
export function ErrorNotice({ primary, secondary, otherLanguage, detail, onRetry, retryDisabled }: ErrorProps) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  return (
    <Edged role="danger" tint={colors.dangerBg}>
      <View style={styles.noticeBody} accessibilityLiveRegion="assertive">
        <Label {...bilingual(primary, secondary)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} tone="danger" weight="semibold" />
        {__DEV__ && detail ? (
          <Text style={[text.caption, fontFor('en'), { color: colors.danger }]}>{detail}</Text>
        ) : null}
        {onRetry ? (
          <Button
            label={bilingual(other.tryAgain, en.tryAgain)}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            variant="danger"
            icon={<RefreshIcon size={20} color={colors.danger} />}
            onPress={onRetry}
            disabled={retryDisabled}
          />
        ) : null}
      </View>
    </Edged>
  );
}

const styles = StyleSheet.create({
  edged: { borderLeftWidth: ROLE_EDGE_WIDTH, paddingLeft: 20, paddingVertical: 16, paddingRight: 20 },
  translating: { gap: spacing.sm },
  steps: { flexDirection: 'row', gap: spacing.xxs },
  step: { height: 3, width: 32, borderRadius: 2 },
  noticeBody: { gap: 12 },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
