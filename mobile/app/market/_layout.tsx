import { Stack } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function MarketsLayout() {
  const { c, mode } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: c.background,
        },
        headerTintColor: c.foreground,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false, // removes the generic border bottom
      }}
    >
      <Stack.Screen name="stocks" options={{ headerShown: false }} />
      <Stack.Screen name="nepse" options={{ headerShown: false }} />
      <Stack.Screen name="gold" options={{ headerShown: false }} />
      <Stack.Screen name="forex" options={{ headerShown: false }} />
      {/* Fallbacks for unfinished routes to prevent crashing when tab grid is clicked */}
      <Stack.Screen name="global" options={{ headerShown: false }} />
      <Stack.Screen name="crypto" options={{ headerShown: false }} />
      <Stack.Screen name="news" options={{ headerShown: false }} />
      <Stack.Screen name="portfolio" options={{ headerShown: false }} />
    </Stack>
  );
}
