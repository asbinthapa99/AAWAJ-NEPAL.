// ─────────────────────────────────────────────────────────────────────────────
// Route: /market/news — Market News placeholder
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function MarketNewsScreen() {
  const { c } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.center}>
        <Ionicons name="newspaper-outline" size={64} color={c.mutedForeground} />
        <Text style={[styles.title, { color: c.foreground }]}>Market News</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          Financial news and market updates will be aggregated here.
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
