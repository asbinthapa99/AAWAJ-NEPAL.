import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { View, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import AnimatedTabIcon from '../../src/components/AnimatedTabIcon';
import ExpandableFAB from '../../src/components/ExpandableFAB';

// Reanimated pulsating badge for Inbox
const AnimatedBadge = ({ count }: { count: number }) => {
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (count > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      );
    }
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.badgeText}>{count}</Text>
    </Animated.View>
  );
};

export default function TabLayout() {
  const { c, mode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(255,255,255,0.1)',
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
        },
        tabBarBackground: () => (
          <BlurView
            tint={mode === 'dark' ? 'dark' : 'regular'}
            intensity={90}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: mode === 'dark' ? '#ffffff' : '#000000',
        tabBarInactiveTintColor: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedTabIcon name={focused ? 'home' : 'home-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide explore from tab bar
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedTabIcon name={focused ? 'play-circle' : 'play-circle-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedTabIcon name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Markets',
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedTabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => <ExpandableFAB />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused, color, size }) => (
            <View>
              <AnimatedTabIcon name={focused ? 'mail' : 'mail-outline'} size={size} color={color} focused={focused} />
              <AnimatedBadge count={3} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedTabIcon name={focused ? 'person' : 'person-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
