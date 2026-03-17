import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

interface GlassSkeletonProps {
  style?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({ 
  style, 
  width = '100%', 
  height = 20, 
  borderRadius = 6 
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      false // don't reverse automatically with boolean flag
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={[{ width: width as DimensionValue, height: height as DimensionValue, borderRadius, overflow: 'hidden' }, style]}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill}>
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
            animatedStyle
          ]} 
        />
      </BlurView>
    </View>
  );
};

export const GlassCard: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  return (
    <View style={[styles.glassCard, style]}>
      <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, styles.glassCardBlur]} />
      <View style={styles.glassCardInner}>
        {children}
      </View>
    </View>
  );
};

export const GlassCardHeader: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
};

export const GlassCardContent: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // fallback if blur doesn't work
  },
  glassCardBlur: {
    borderRadius: 16,
  },
  glassCardInner: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
    gap: 8,
  },
  cardContent: {
    gap: 8,
  },
});
