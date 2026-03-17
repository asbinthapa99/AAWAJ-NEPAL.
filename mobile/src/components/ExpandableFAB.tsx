import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';

export default function ExpandableFAB() {
  const { c } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    animation.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const navTo = (path: any) => {
    toggleMenu();
    setTimeout(() => {
      router.push(path);
    }, 150);
  };

  const mainIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${interpolate(animation.value, [0, 1], [0, 45])}deg` },
      ],
    };
  });

  const postBtnStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [0, -60]) },
        { scale: animation.value },
      ],
    };
  });

  const reelBtnStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [0, -110]) },
        { scale: animation.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Option 2: Reel */}
      <Animated.View style={[styles.subBtnWrap, reelBtnStyle]}>
        <Text style={[styles.subBtnLabel, { color: c.card, backgroundColor: c.foreground }]}>Reel</Text>
        <TouchableOpacity
          onPress={() => navTo('/post/create?type=reel')}
          style={[styles.subBtn, { backgroundColor: c.card }]}
        >
          <Ionicons name="videocam" size={20} color={c.foreground} />
        </TouchableOpacity>
      </Animated.View>

      {/* Option 1: Post */}
      <Animated.View style={[styles.subBtnWrap, postBtnStyle]}>
        <Text style={[styles.subBtnLabel, { color: c.card, backgroundColor: c.foreground }]}>Post</Text>
        <TouchableOpacity
          onPress={() => navTo('/post/create?type=post')}
          style={[styles.subBtn, { backgroundColor: c.card }]}
        >
          <Ionicons name="create" size={20} color={c.foreground} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Toggle Button */}
      <TouchableOpacity onPress={toggleMenu} activeOpacity={0.8}>
        <Animated.View style={[styles.mainBtn, { backgroundColor: c.primary }, mainIconStyle]}>
          <Ionicons name="add" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  mainBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  subBtnWrap: {
    position: 'absolute',
    alignItems: 'center',
    flexDirection: 'row',
    right: 4, // Align to the right side of the main button
  },
  subBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginLeft: 10,
  },
  subBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
