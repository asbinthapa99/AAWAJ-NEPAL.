// ─────────────────────────────────────────────────────────────────────────────
// AnimatedNumber — smooth spring-animated number transitions using Reanimated 3.
//
// WHY: Direct text updates for price changes look jarring (instant jump from
// $185.50 → $186.20). This component interpolates between the old and new
// value over ~400ms with a spring animation, making the dashboard feel alive
// and premium without being distracting.
//
// HOW: We use Reanimated's `useSharedValue` + `withTiming` on the UI thread.
// The animated value drives a derived text string via `useDerivedValue`.
// The component updates the target value whenever `value` prop changes,
// and the spring animation smoothly transitions from old → new.
//
// PERFORMANCE: All animation logic runs on the UI thread via Reanimated's
// worklet system — zero JS bridge overhead, 60fps even during burst updates.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { NUMBER_TRANSITION_DURATION_MS } from '../utils/constants';

// Reanimated requires AnimatedProps on a native component.
// We use TextInput in non-editable mode because Animated.Text doesn't
// support animatedProps for text content — TextInput's `text` prop can
// be driven by animated values.
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  colorPositive?: string;
  colorNegative?: string;
  colorNeutral?: string;
  showSign?: boolean;
}

const AnimatedNumber = React.memo(({
  value,
  prefix = '',
  suffix = '',
  decimalPlaces = 2,
  duration = NUMBER_TRANSITION_DURATION_MS,
  style,
  colorPositive,
  colorNegative,
  colorNeutral,
  showSign = false,
}: AnimatedNumberProps) => {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    const num = animatedValue.value;
    const sign = showSign && num > 0 ? '+' : '';
    const formatted = `${prefix}${sign}${num.toFixed(decimalPlaces)}${suffix}`;
    return {
      text: formatted,
      // We can't animate color via animatedProps on TextInput.
      // Color is set via static style prop instead.
    } as any;
  });

  // Determine color based on value
  const textColor = colorPositive && colorNegative
    ? value > 0
      ? colorPositive
      : value < 0
        ? colorNegative
        : (colorNeutral || colorPositive)
    : undefined;

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      style={[
        {
          padding: 0,
          margin: 0,
          fontVariant: ['tabular-nums'],  // Prevents layout shift on digit changes
        },
        style,
        textColor ? { color: textColor } : undefined,
      ]}
      defaultValue={`${prefix}${value.toFixed(decimalPlaces)}${suffix}`}
    />
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';

export default AnimatedNumber;
