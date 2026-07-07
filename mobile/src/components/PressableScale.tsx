import { useRef } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  /** Set when this button is a flex child that must share row/column space. */
  flexFill?: boolean;
  /** Scale while pressed. Subtle by design (HIG: 0.95–1.0). */
  pressScale?: number;
}

/**
 * The app's one press-feedback primitive: every tappable surface scales gently
 * on press-in and springs back on release. Transform-only (no layout shift),
 * disabled automatically when the system Reduce Motion setting is on.
 *
 * Layout styles live on the Pressable (so flex rows measure it correctly);
 * the Animated.View child only carries the transform.
 */
export function PressableScale({
  style,
  flexFill,
  pressScale = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const animateTo = (value: number) => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: value,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      {...rest}
      style={flexFill ? { flex: 1, minWidth: 0 } : undefined}
      onPressIn={(event) => {
        animateTo(pressScale);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      unstable_pressDelay={0}
    >
      {(state) => (
        <Animated.View style={[flexFill && styles.fill, style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = {
  // NOT `flex: 1`: its implicit flexBasis 0 makes native Yoga collapse this
  // view to zero height inside an auto-sized Pressable, so buttons paint over
  // their siblings on device. Web flexbox clamps to content size and hides
  // the bug — which is why every browser preview looked fine.
  fill: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto' } as ViewStyle,
};
