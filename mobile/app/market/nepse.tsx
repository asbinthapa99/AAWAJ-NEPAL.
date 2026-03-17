import React, { Suspense, lazy } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../../src/providers/ThemeProvider';
import { GlassSkeleton } from '../../src/components/GlassSkeleton';

const BarChart = lazy(() => import('react-native-chart-kit').then(module => ({ default: module.BarChart })));

const { width } = Dimensions.get('window');

const MOCK_TRADED = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', price: 'Rs 1,234', change: '+3.78%', positive: true },
  { symbol: 'NICA', name: 'NIC Asia Bank', price: 'Rs 987', change: '-1.20%', positive: false },
  { symbol: 'CIT', name: 'Citizen Investment Trust', price: 'Rs 2,150', change: '+0.55%', positive: true },
];

export default function NEPSEScreen() {
  const { c, mode } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      
      {/* Simple Index Card */}
      <View style={[styles.indexCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.indexTitle, { color: c.mutedForeground }]}>NEPSE Index</Text>
        <View style={styles.indexRow}>
          <Text style={[styles.indexValue, { color: c.foreground }]}>2,456.78</Text>
          <Text style={[styles.indexChange, { color: '#10B981' }]}>+2.34%</Text>
        </View>
        <Text style={[styles.indexDate, { color: c.mutedForeground }]}>Last updated: 3:00 PM NPT</Text>
      </View>

      {/* Volume Chart */}
      <View style={[styles.mainCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.mainTitle, { color: c.foreground }]}>Weekly Trading Volume</Text>
        
        <Suspense fallback={<GlassSkeleton width="100%" height={220} borderRadius={16} />}>
          <BarChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
              datasets: [
                {
                  data: [420, 500, 380, 580, 480]
                }
              ]
            }}
            width={width - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            withInnerLines={false}
            showBarTops={false}
            fromZero
            chartConfig={{
              backgroundColor: c.card,
              backgroundGradientFrom: c.card,
              backgroundGradientTo: c.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`, // Cyan bars
              labelColor: (opacity = 1) => c.mutedForeground,
              style: {
                borderRadius: 16
              },
              barPercentage: 0.7,
              fillShadowGradientFrom: '#06B6D4',
              fillShadowGradientFromOpacity: 1,
              fillShadowGradientTo: '#06B6D4',
              fillShadowGradientToOpacity: 1,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              marginLeft: -20,
            }}
          />
        </Suspense>
      </View>

      <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>Top Traded</Text>

      {/* Stock List */}
      <View style={styles.list}>
        {MOCK_TRADED.map((stock, i) => (
          <View key={i} style={[styles.listItem, { backgroundColor: c.card, borderColor: c.border }]}>
            <View>
              <Text style={[styles.symbol, { color: c.foreground }]}>{stock.symbol}</Text>
              <Text style={[styles.companyName, { color: c.mutedForeground }]}>{stock.name}</Text>
            </View>
            
            <View style={[styles.miniChartLine, { backgroundColor: stock.positive ? '#10B981' : '#EF4444' }]} />

            <View style={styles.alignRight}>
              <Text style={[styles.price, { color: c.foreground }]}>{stock.price}</Text>
              <View style={[styles.badge, { backgroundColor: stock.positive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={[styles.changeText, { color: stock.positive ? '#10B981' : '#EF4444' }]}>{stock.change}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  indexCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  indexTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  indexRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 12,
  },
  indexValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  indexChange: {
    fontSize: 18,
    fontWeight: '600',
  },
  indexDate: {
    fontSize: 12,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 13,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  miniChartLine: {
    width: 60,
    height: 2,
    borderRadius: 2,
    opacity: 0.8,
  }
});
