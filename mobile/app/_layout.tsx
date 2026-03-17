import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider';

// Keep splash screen visible until fonts are ready
SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';
    const inTabsGroup = segments[0] === '(tabs)';
    const inUserGroup = segments[0] === 'u';
    const inPostGroup = segments[0] === 'post';
    const inMarketGroup = segments[0] === 'market';
    const inNotifications = segments[0] === 'notifications';

    const isAuthorizedRoute = inTabsGroup || inUserGroup || inPostGroup || inMarketGroup || inNotifications;

    if (!user && !inAuthGroup && !isAuthorizedRoute && segments.length > 0) {
      router.replace('/');
    } else if (user && (inAuthGroup || (segments as string[]).length === 0)) {
      router.replace('/(tabs)/home');
    } else if (!user && (segments as string[]).length === 0) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right',
      animationDuration: 300,
    }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="u" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="market" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Ionicons (used on all tab icons and throughout the app)
    ...Ionicons.font,
    // Optional: include other icon sets you use
    ...MaterialCommunityIcons.font,
    ...FontAwesome.font,
  });

  useEffect(() => {
    // Hide splash once fonts are ready (or if there's an error — don't block forever)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGuard />
      </AuthProvider>
    </ThemeProvider>
  );
}
