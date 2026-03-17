import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  // useRef is now called at the top level of a component — rules of hooks satisfied
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.90,
      friction: 4,
      tension: 400,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 400,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: cardBg,
            borderColor: borderColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          {iconType === 'material' ? (
            <MaterialCommunityIcons name={icon as any} size={24} color={color} />
          ) : (
            <Ionicons name={icon as any} size={24} color={color} />
          )}
        </View>
        <Text style={[styles.cardTitle, { color: foreground }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: mutedForeground }]}>{desc}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
  },
});
