// ─────────────────────────────────────────────────────────────────────────────
// Route: /market/global — Global Markets placeholder
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function GlobalMarketsScreen() {
  const { c } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.center}>
        <Ionicons name="earth" size={64} color={c.mutedForeground} />
        <Text style={[styles.title, { color: c.foreground }]}>Global Markets</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          Worldwide indices, commodities, and bonds tracking coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', marginTop: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
