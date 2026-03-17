import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function GetStartedScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/discover');
  };

  const handleSkip = () => {
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Get Started
          </Text>
          <Text style={styles.subtitle}>
            Connect with friends, share your thoughts, and stay updated with the community.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5FA',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    width: '100%',
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  progressSegment: {
    height: 4,
    flex: 1,
    maxWidth: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#000000',
  },
  skipButton: {
    paddingLeft: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  continueButton: {
    backgroundColor: '#000000',
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
