import { useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, fontFor, radius, serifFor, useTheme, type BilingualLabel } from '../../theme';
import { CloseIcon } from '../icons';

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
 * The one sage sheet: cream, 32pt top radius, grabber, Newsreader title with
 * its English echo, and a white-circle close. Dismisses on scrim tap, X, or a
 * downward swipe starting on the header.
 */
export function Sheet({ visible, onClose, title, otherLanguage, icon, keyboard = false, children }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  const Wrapper = keyboard ? KeyboardAvoidingView : View;
  const swipeFrom = useRef(0);

  const onHeaderTouchStart = (e: GestureResponderEvent) => {
    swipeFrom.current = e.nativeEvent.pageY;
  };
  const onHeaderTouchEnd = (e: GestureResponderEvent) => {
    if (e.nativeEvent.pageY - swipeFrom.current > 60) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Wrapper style={[styles.backdrop, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel={`${other.close}. ${en.close}`} />
        <View style={[styles.sheet, { backgroundColor: colors.cream }]}>
          <View style={styles.grabberRow} importantForAccessibility="no">
            <View style={[styles.grabber, { backgroundColor: colors.grabber }]} />
          </View>
          <View
            style={styles.header}
            onTouchStart={onHeaderTouchStart}
            onTouchEnd={onHeaderTouchEnd}
          >
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <View style={styles.titleWrap}>
              <Text
                style={[styles.title, serifFor(otherLanguage.code, 'medium'), { color: colors.ink }]}
                accessibilityRole="header"
                accessibilityLanguage={otherLanguage.speechTag}
                allowFontScaling
                maxFontSizeMultiplier={1.4}
              >
                {title.primary}
              </Text>
              {title.secondary ? (
                <Text style={[styles.subtitle, fontFor('en'), { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={1.4}>
                  {title.secondary}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={bilingual(other.close, en.close).primary}
              style={({ pressed }) => [styles.close, { backgroundColor: colors.white }, pressed && styles.pressed]}
            >
              <CloseIcon size={18} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </Wrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  grabberRow: { alignItems: 'center' },
  grabber: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { width: 24, alignItems: 'center' },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 30, lineHeight: 34 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 8 },
  pressed: { opacity: 0.9 },
});
