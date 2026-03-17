import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import TradingViewChart from '../TradingViewChart';

export default function StocksScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Live Stocks Chart</Text>
      <TradingViewChart symbol="AAPL" />
      {/* You can add more TradingViewChart components for other stocks */}
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
