import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider';

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup && segments.length > 0) {
      // User is logged out and NOT in the auth group or root welcome screen. Go back to welcome screen.
      router.replace('/');
    }
  }, [user, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGuard />
      </AuthProvider>
    </ThemeProvider>
  );
}
