import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import TradingViewOverview from '../TradingViewOverview';

export default function StocksOverviewScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Live Stocks Overview</Text>
      <TradingViewOverview />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
