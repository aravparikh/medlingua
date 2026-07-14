import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewProps } from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from '../theme';

/**
 * Fades + drifts children in on mount (ease-out, one motion token). Used for
 * new conversation turns, error cards, panels, and screen changes so content
 * arrives, never snaps. Renders statically when Reduce Motion is on.
 * Accessibility props (live regions etc.) pass through to the view.
 */
export function Appear({ children, style, ...rest }: ViewProps) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  if (reducedMotion) {
    return (
      <Animated.View style={style} {...rest}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      {...rest}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
