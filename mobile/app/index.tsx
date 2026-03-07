import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { Feather } from '@expo/vector-icons';

const { height } = Dimensions.get('window');
const SWIPE_THRESHOLD = -height * 0.2; // swipe up 20% of screen to unlock

export default function WelcomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if logged in (skip welcome)
  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading]);

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical swipes (upwards)
        return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
          opacity.setValue(1 + (gestureState.dy / (height * 0.4)));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < SWIPE_THRESHOLD || gestureState.vy < -1.5) {
          // Unlock threshold met, slide the rest of the way up and navigate
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -height,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start(() => {
            navigateToLogin();
          });
        } else {
          // Spring back down
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 12,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        }
      },
    })
  ).current;

  if (loading || user) return null; // Let the redirect or auth state settle

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            opacity
          }
        ]}
      >
        <View style={styles.topSection}>
          {/* Top section left empty to remove time/date per request */}
        </View>

        <View style={styles.middleSection}>
          <Text style={styles.title}>welcome to guffaff</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.swipeIconBox}>
            <Feather name="chevron-up" size={32} color="#ffffff" style={{ opacity: 0.5 }} />
            <Feather name="chevron-up" size={32} color="#ffffff" style={{ marginTop: -20, opacity: 0.8 }} />
            <Feather name="chevron-up" size={32} color="#ffffff" style={{ marginTop: -20 }} />
          </View>
          <Text style={styles.swipeText}>swipe hightech up to get started</Text>
        </View>
      </Animated.View >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -2,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  middleSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  swipeIconBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  swipeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
