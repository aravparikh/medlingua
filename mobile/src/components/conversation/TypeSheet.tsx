import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ENGLISH, type Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, fontFor, radius, spacing, tapTarget, useTheme } from '../../theme';
import { ArrowForwardIcon, CheckIcon, PencilIcon, PersonIcon } from '../icons';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Sheet } from './Sheet';

interface Props {
  visible: boolean;
  otherLanguage: Language;
  draft: string;
  onChangeDraft: (value: string) => void;
  nameMode: boolean;
  onToggleNameMode: () => void;
  onClose: () => void;
  onSend: (who: Language) => void;
}

/** Typed fallback for loud rooms or a failing mic, plus name mode (verbatim, never translated). */
export function TypeSheet({ visible, otherLanguage, draft, onChangeDraft, nameMode, onToggleNameMode, onClose, onSend }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  const canSend = draft.trim().length > 0;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={bilingual(other.typeLabel, en.typeLabel)}
      otherLanguage={otherLanguage}
      icon={<PencilIcon size={24} color={colors.ink} />}
      keyboard
    >
      <View style={styles.content}>
        <Pressable
          onPress={onToggleNameMode}
          accessibilityRole="switch"
          accessibilityState={{ checked: nameMode }}
          accessibilityLabel={`${other.nameLabel}. ${en.nameLabel}. ${other.nameHint}`}
          style={({ pressed }) => [
            styles.nameRow,
            { borderColor: nameMode ? colors.accent : colors.border, backgroundColor: pressed ? colors.surfacePressed : colors.bg },
          ]}
        >
          <PersonIcon size={22} color={nameMode ? colors.accent : colors.ink2} />
          <Label
            {...bilingual(other.nameLabel, en.nameLabel)}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            weight="semibold"
            style={styles.nameText}
          />
          <View style={[styles.check, { borderColor: nameMode ? colors.accent : colors.border, backgroundColor: nameMode ? colors.accent : 'transparent' }]}>
            {nameMode ? <CheckIcon size={16} color={colors.onAccent} /> : null}
          </View>
        </Pressable>
        {nameMode ? (
          <Label {...bilingual(other.nameHint, en.nameHint)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="caption" tone="ink2" />
        ) : null}

        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={nameMode ? other.namePlaceholder : other.typePlaceholder}
          placeholderTextColor={colors.ink2}
          multiline={!nameMode}
          autoFocus
          autoCapitalize={nameMode ? 'words' : 'sentences'}
          autoCorrect={!nameMode}
          accessibilityLabel={nameMode ? `${other.nameLabel}. ${en.nameLabel}` : `${other.typeLabel}. ${en.typeLabel}`}
          style={[
            styles.input,
            fontFor(otherLanguage.code),
            { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />

        <View style={styles.sendRow}>
          <Button
            label={{ primary: ENGLISH.nativeName }}
            lang="en"
            variant="accent"
            size="primary"
            flex
            disabled={!canSend}
            icon={<ArrowForwardIcon size={20} color={colors.onAccent} />}
            onPress={() => onSend(ENGLISH)}
          />
          <Button
            label={{ primary: otherLanguage.nativeName }}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            variant="ink"
            size="primary"
            flex
            disabled={!canSend}
            icon={<ArrowForwardIcon size={20} color={colors.bg} />}
            onPress={() => onSend(otherLanguage)}
          />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: tapTarget.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  nameText: { flex: 1 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  // Explicit horizontal padding + a card radius (not a pill): on a tall
  // multiline box the pill's end curves eat into the first and last lines,
  // which is what pushed text outside the visible box.
  input: {
    minHeight: 112,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  sendRow: { flexDirection: 'row', gap: spacing.sm },
});
