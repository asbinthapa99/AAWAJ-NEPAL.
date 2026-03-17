import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if logged in (skip welcome)
  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading]);

  const navigateToLogin = () => {
    router.replace('/onboarding/get-started');
  };

  if (loading || user) return null; // Let the redirect or auth state settle

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>
        <TouchableOpacity onPress={navigateToLogin} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Content Area */}
      <View style={styles.contentArea}>
        {/* Background gradient handled in styling via backgroundColor container */}
        
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {/* Use the dynamically created image or fallback if not ready */}
          <Image 
            source={require('../assets/images/welcome-hero.png')} 
            style={styles.heroImage} 
            resizeMode="contain" 
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Connect with family{'\n'}on Awaaz Nepal
          </Text>
          <Text style={styles.subtitle}>
            Share your updates and create new{'\n'}moments with your Family
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={navigateToLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5FA', // Light greyish-blue background from screenshot
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Avoid safe area notch
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    maxHeight: height * 0.55,
  },
  heroImage: {
    width: width * 0.9,
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 40,
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
