import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MarketCardProps {
  title: string;
  desc: string;
  icon: string;
  iconType: string;
  color: string;
  cardWidth: number;
  cardBg: string;
  borderColor: string;
  foreground: string;
  mutedForeground: string;
  onPress: () => void;
}

export default function MarketCard({
  title,
  desc,
  icon,
  iconType,
  color,
  cardWidth,
  cardBg,
  borderColor,
  foreground,
  mutedForeground,
  onPress,
}: MarketCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 5,
      tension: 400,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 400,
      useNativeDriver: true,
    }).start();
  };

  // Convert hex color to rgba for smooth gradient fade
  const fadeColor = color.length === 7 ? color + '40' : color;
  const transparentColor = color.length === 7 ? color + '00' : 'transparent';

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: cardWidth }}>
        <LinearGradient
          colors={[fadeColor, transparentColor, transparentColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              {iconType === 'material' ? (
                <MaterialCommunityIcons name={icon as any} size={28} color={color} />
              ) : (
                <Ionicons name={icon as any} size={28} color={color} />
              )}
            </View>
            <Text style={[styles.cardTitle, { color: foreground }]}>{title}</Text>
            <Text style={[styles.cardDesc, { color: mutedForeground }]}>{desc}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 24,
    padding: 1.5, // acts as border width
  },
  card: {
    padding: 16,
    borderRadius: 22.5, // slightly less than outer radius
    height: '100%',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
  },
});
