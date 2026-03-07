import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// A large moving, softly colored orb
const LiquidOrb = ({
    size,
    color,
    initialX,
    initialY,
    delay,
    duration,
    moveX,
    moveY
}: {
    size: number,
    color: string,
    initialX: number,
    initialY: number,
    delay: number,
    duration: number,
    moveX: number,
    moveY: number
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: duration,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [anim, duration, delay]);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, moveY],
    });

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, moveX],
    });

    const scale = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                left: initialX,
                top: initialY,
                transform: [
                    { translateY },
                    { translateX },
                    { scale }
                ],
                opacity: 0.7, // softer opacity for the liquid blur
            }}
        />
    );
};

export default function AnimatedBackground() {
    return (
        <View style={styles.container}>
            {/* Base cyberpunk dark background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#090514' }]} />

            {/* Cyberpunk neon moving orbs */}
            <LiquidOrb size={width * 1.5} color="#ff0055" initialX={-width * 0.5} initialY={-height * 0.2} delay={0} duration={12000} moveX={100} moveY={150} />
            <LiquidOrb size={width * 1.8} color="#00ffcc" initialX={width * 0.1} initialY={height * 0.1} delay={2000} duration={15000} moveX={-150} moveY={-100} />
            <LiquidOrb size={width * 1.4} color="#7000ff" initialX={-width * 0.2} initialY={height * 0.5} delay={1000} duration={10000} moveX={200} moveY={-200} />
            <LiquidOrb size={width * 1.2} color="#ff00d4" initialX={width * 0.3} initialY={height * 0.6} delay={3000} duration={14000} moveX={-100} moveY={100} />

            {/* Heavy Blur Overlay to create the glass/liquid neon mixing effect */}
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
            {/* A second blur pass for a smoother mix */}
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

            {/* Cyberpunk grid/scanline subtle overlay */}
            <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#090514',
        overflow: 'hidden',
    },
});
