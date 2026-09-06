import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, elevation, radius, spacing, tapTarget, useTheme, type BilingualLabel } from '../../theme';
import { CloseIcon } from '../icons';
import { Label } from '../ui/Label';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: BilingualLabel;
  otherLanguage: Language;
  icon?: ReactNode;
  /** Wrap in KeyboardAvoidingView (sheets with a text field). */
  keyboard?: boolean;
  children: ReactNode;
}

/**
 * The one sheet. Slides up over a scrim, sits on `bg` with the sheet radius
 * and the app's single shadow. Header: optional icon, the title on the
 * bilingual rule, a 48pt close.
 */
export function Sheet({ visible, onClose, title, otherLanguage, icon, keyboard = false, children }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  const Wrapper = keyboard ? KeyboardAvoidingView : View;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Wrapper style={[styles.backdrop, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel={`${other.close}. ${en.close}`} />
        <View style={[styles.sheet, { backgroundColor: colors.bg }, elevation.sheet]}>
          <View style={[styles.header, { borderBottomColor: colors.rule }]}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Label primary={title.primary} secondary={title.secondary} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="title" weight="semibold" style={styles.title} />
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={bilingual(other.close, en.close).primary}
              style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.surfacePressed }]}
            >
              <CloseIcon size={24} color={colors.ink} />
            </Pressable>
          </View>
          {children}
        </View>
      </Wrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  dismiss: { flex: 1 },
  sheet: { maxHeight: '86%', borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 24, alignItems: 'center' },
  title: { flex: 1 },
  close: { width: tapTarget.min, height: tapTarget.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
});
