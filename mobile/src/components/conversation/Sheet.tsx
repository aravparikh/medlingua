import { useRef, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, fontFor, radius, serifFor, typeCap, useTheme, type BilingualLabel } from '../../theme';
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
  const insets = useSafeAreaInsets();
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

  // pageSheet rather than a transparent overlay: iOS then presents this as a
  // real card — rounded top, the screen behind scaling back, and swipe-to-
  // dismiss for free. It is incompatible with `transparent`, so the hand-drawn
  // scrim goes with it and UIKit dims the background itself. Android and web
  // ignore the prop and fall back to a standard full-screen modal.
  //
  // The grabber stays hand-drawn: UIKit only shows its own when
  // prefersGrabberVisible is set on the sheet controller, which React Native's
  // Modal does not expose. Without ours there would be no drag affordance.
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Wrapper
        style={[styles.sheet, { backgroundColor: colors.cream, paddingBottom: insets.bottom + 24 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
                maxFontSizeMultiplier={typeCap.chrome}
              >
                {title.primary}
              </Text>
              {title.secondary ? (
                <Text style={[styles.subtitle, fontFor('en'), { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
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
      </Wrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingTop: 12, paddingHorizontal: 16, gap: 16 },
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
  close: { width: 36, height: 36, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 8 },
  pressed: { opacity: 0.9 },
});
