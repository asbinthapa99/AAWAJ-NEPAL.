import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, SafeAreaView as RNSafeAreaView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function CalendarScreen() {
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState<'np' | 'en'>('np');
  const [fullCalendarVisible, setFullCalendarVisible] = useState(false);

  const toggleLang = () => {
    setLang(prev => prev === 'np' ? 'en' : 'np');
  };

  return (
    <View style={[styles.container, { backgroundColor: mode === 'dark' ? '#000' : '#f8f9fa' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Red Header Area */}
        <View style={[styles.headerArea, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={toggleLang} style={styles.langToggleBtn}>
              <Ionicons name="earth" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.titleNep}>{lang === 'np' ? 'नेपाली पात्रो' : 'Nepali Calendar'}</Text>
              <Text style={styles.titleEng}>{lang === 'np' ? 'Nepali Calendar' : 'नेपाली पात्रो'}</Text>
            </View>
            <TouchableOpacity style={styles.calendarIconBtn}>
              <Ionicons name="calendar" size={20} color="#da1c22" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerBottom}>
            <View>
              <View style={styles.dateRow}>
                <Text style={styles.dateDayNep}>२५</Text>
                <Text style={styles.dateMonthNep}>चैत्र</Text>
              </View>
              <Text style={styles.dateEng1}>2081 BS • Tuesday</Text>
              <Text style={styles.dateEng2}>March 11, 2026 AD</Text>
            </View>
            <View style={styles.weatherCol}>
              <Ionicons name="sunny" size={48} color="#fde047" style={styles.weatherIcon} />
              <Text style={styles.temperature}>26°C</Text>
              <Text style={styles.weatherText}>Sunny</Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Calendar Card */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>चैत्र २०८१</Text>
              <TouchableOpacity onPress={() => setFullCalendarVisible(true)}>
                <Text style={styles.viewFullText}>View Full</Text>
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.grid}>
              {['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'].map((day) => (
                <Text key={day} style={[styles.gridDayLabel, { color: c.mutedForeground }]}>{day}</Text>
              ))}

              {/* Row 1 */}
              {[27, 28, 29, 30, 31].map(d => (
                <View key={`r1_${d}`} style={styles.cell}>
                  <Text style={[styles.cellText, { color: c.mutedForeground, opacity: 0.5 }]}>{d}</Text>
                </View>
              ))}
              <View style={[styles.cell, styles.holidayCell, { backgroundColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}>
                <Text style={[styles.cellText, styles.holidayText]}>1</Text>
                <Text style={styles.holidayLabel}>होली</Text>
              </View>
              <View style={styles.cell}>
                <Text style={[styles.cellText, { color: c.foreground }]}>2</Text>
              </View>

              {/* Rows 2-4 */}
              {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((d) => (
                <View key={`r_${d}`} style={styles.cell}>
                  <Text style={[styles.cellText, { color: c.foreground }]}>{d}</Text>
                </View>
              ))}

              {/* Row 5 */}
              <View style={[styles.cell, styles.todayCell]}>
                <Text style={[styles.cellText, styles.todayText]}>25</Text>
              </View>
              {[26,27,28,29,30].map(d => (
                <View key={`r5_${d}`} style={styles.cell}>
                  <Text style={[styles.cellText, { color: c.foreground }]}>{d}</Text>
                </View>
              ))}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#da1c22' }]} />
                <Text style={[styles.legendText, { color: c.mutedForeground }]}>Today</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1 }]} />
                <Text style={[styles.legendText, { color: c.mutedForeground }]}>Holiday</Text>
              </View>
            </View>
          </View>

          {/* Panchang Section */}
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>आजको विवरण</Text>
          
          <View style={[styles.panchangContainer, { backgroundColor: c.background, borderColor: c.border }]}>
            <View style={styles.panchangRow}>
              {/* Box 1 */}
              <View style={[styles.panchangBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.panchangBoxHeader}>
                  <Ionicons name="calendar-outline" size={14} color="#da1c22" />
                  <Text style={[styles.panchangBoxLabel, { color: c.mutedForeground }]}>पञ्चाङ्ग</Text>
                </View>
                <Text style={[styles.panchangBoxTitle, { color: c.foreground }]}>तृतीया</Text>
                <Text style={[styles.panchangBoxSub, { color: c.mutedForeground }]}>शुक्ल पक्ष</Text>
              </View>

              {/* Box 2 */}
              <View style={[styles.panchangBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.panchangBoxHeader}>
                  <Ionicons name="star-outline" size={14} color="#f97316" />
                  <Text style={[styles.panchangBoxLabel, { color: c.mutedForeground }]}>नक्षत्र</Text>
                </View>
                <Text style={[styles.panchangBoxTitle, { color: c.foreground }]}>रोहिणी</Text>
                <Text style={[styles.panchangBoxSub, { color: c.mutedForeground }]}>शुभ मुहूर्त</Text>
              </View>
            </View>

            <View style={styles.panchangRow}>
              {/* Box 3 */}
              <View style={[styles.sunBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                  <Ionicons name="partly-sunny-outline" size={20} color="#f97316" />
                </View>
                <View>
                  <Text style={[styles.sunLabel, { color: c.mutedForeground }]}>सूर्योदय</Text>
                  <Text style={[styles.sunTime, { color: c.foreground }]}>06:12 AM</Text>
                </View>
              </View>

              {/* Box 4 */}
              <View style={[styles.sunBox, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="cloudy-night-outline" size={20} color="#6366f1" />
                </View>
                <View>
                  <Text style={[styles.sunLabel, { color: c.mutedForeground }]}>सूर्यास्त</Text>
                  <Text style={[styles.sunTime, { color: c.foreground }]}>06:28 PM</Text>
                </View>
            </View>
          </View>

          {/* Quick Links Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 0 }]}>द्रुत पहुँच</Text>
          </View>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="star-outline" size={24} color="#a855f7" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>राशिफल</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="gift-outline" size={24} color="#ec4899" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>चाडपर्व</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="calendar-outline" size={24} color="#0ea5e9" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>सार्वजनिक बिदा</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="trending-up-outline" size={24} color="#22c55e" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>विनिमय दर</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#cffafe' }]}>
                <Ionicons name="cloud-outline" size={24} color="#06b6d4" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>मौसम</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#fef08a' }]}>
                <Ionicons name="document-text-outline" size={24} color="#eab308" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>सूचना</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="swap-horizontal-outline" size={24} color="#ef4444" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>मिति रूपान्तरण</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.quickLinkIconBox, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="notifications-outline" size={24} color="#8b5cf6" />
              </View>
              <Text style={[styles.quickLinkText, { color: c.foreground }]}>अनुस्मारक</Text>
            </TouchableOpacity>
          </View>

          {/* News Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="newspaper-outline" size={20} color={c.foreground} />
              <Text style={[styles.sectionTitle, { color: c.foreground, marginBottom: 0 }]}>समाचार</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewFullText}>सबै हेर्नुहोस्</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.newsList}>
            {/* News Item 1 */}
            <TouchableOpacity style={[styles.newsCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.newsImgPlaceholder, { backgroundColor: c.muted }]} />
              <View style={styles.newsContent}>
                <View style={[styles.newsBadge, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.newsBadgeText, { color: '#ef4444' }]}>राष्ट्रिय</Text>
                </View>
                <Text style={[styles.newsTitle, { color: c.foreground }]} numberOfLines={2}>नेपाल र भारतबीच व्यापार सम्झौता</Text>
                <Text style={[styles.newsDesc, { color: c.mutedForeground }]} numberOfLines={2}>काठमाडौँ। नेपाल र भारतबीच नयाँ व्यापार सम्झौता भएको छ...</Text>
                <Text style={[styles.newsTime, { color: c.mutedForeground }]}>२ घण्टा अगाडि</Text>
              </View>
            </TouchableOpacity>

            {/* News Item 2 */}
            <TouchableOpacity style={[styles.newsCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.newsImgPlaceholder, { backgroundColor: c.muted }]} />
              <View style={styles.newsContent}>
                <View style={[styles.newsBadge, { backgroundColor: '#f0fdf4' }]}>
                  <Text style={[styles.newsBadgeText, { color: '#22c55e' }]}>खेलकुद</Text>
                </View>
                <Text style={[styles.newsTitle, { color: c.foreground }]} numberOfLines={2}>नेपाली क्रिकेट टोलीको ऐतिहासिक जित</Text>
                <Text style={[styles.newsDesc, { color: c.mutedForeground }]} numberOfLines={2}>पोखरा। नेपाली क्रिकेट टोलीले आज ऐतिहासिक जित हासिल गरेको छ...</Text>
                <Text style={[styles.newsTime, { color: c.mutedForeground }]}>४ घण्टा अगाडि</Text>
              </View>
            </TouchableOpacity>

            {/* News Item 3 */}
            <TouchableOpacity style={[styles.newsCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.newsImgPlaceholder, { backgroundColor: c.muted }]} />
              <View style={styles.newsContent}>
                <View style={[styles.newsBadge, { backgroundColor: '#fef9c3' }]}>
                  <Text style={[styles.newsBadgeText, { color: '#eab308' }]}>अर्थतन्त्र</Text>
                </View>
                <Text style={[styles.newsTitle, { color: c.foreground }]} numberOfLines={2}>सुनको मूल्यमा वृद्धि</Text>
                <Text style={[styles.newsDesc, { color: c.mutedForeground }]} numberOfLines={2}>काठमाडौँ। आज सुनको मूल्यमा प्रति तोला रु ५०० वृद्धि भएको छ...</Text>
                <Text style={[styles.newsTime, { color: c.mutedForeground }]}>६ घण्टा अगाडि</Text>
              </View>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full Calendar Modal */}
      <Modal visible={fullCalendarVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFullCalendarVisible(false)}>
        <RNSafeAreaView style={[styles.modalContainer, { backgroundColor: c.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setFullCalendarVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={c.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: c.foreground }]}>आगामी बिदा तथा पर्वहरू</Text>
            <View style={{ width: 40 }} /> {/* Spacer to align title */}
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Calendar Grid inside Modal */}
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: 16, marginBottom: 8 }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: c.foreground }]}>चैत्र २०८१</Text>
              </View>

              <View style={styles.grid}>
                {['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'].map((day) => (
                  <Text key={`modal_day_${day}`} style={[styles.gridDayLabel, { color: c.mutedForeground }]}>{day}</Text>
                ))}

                {/* Row 1 */}
                {[27, 28, 29, 30, 31].map(d => (
                  <View key={`m_r1_${d}`} style={styles.cell}>
                    <Text style={[styles.cellText, { color: c.mutedForeground, opacity: 0.5 }]}>{d}</Text>
                  </View>
                ))}
                <View style={[styles.cell, styles.holidayCell, { backgroundColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}>
                  <Text style={[styles.cellText, styles.holidayText]}>1</Text>
                  <Text style={styles.holidayLabel}>होली</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: c.foreground }]}>2</Text>
                </View>

                {/* Rows 2-4 */}
                {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((d) => (
                  <View key={`m_r_${d}`} style={styles.cell}>
                    <Text style={[styles.cellText, { color: c.foreground }]}>{d}</Text>
                  </View>
                ))}

                {/* Row 5 */}
                <View style={[styles.cell, styles.todayCell]}>
                  <Text style={[styles.cellText, styles.todayText]}>25</Text>
                </View>
                {[26,27,28,29,30].map(d => (
                  <View key={`m_r5_${d}`} style={styles.cell}>
                    <Text style={[styles.cellText, { color: c.foreground }]}>{d}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#da1c22' }]} />
                  <Text style={[styles.legendText, { color: c.mutedForeground }]}>Today</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1 }]} />
                  <Text style={[styles.legendText, { color: c.mutedForeground }]}>Holiday</Text>
                </View>
              </View>
            </View>

            {/* Mock Holiday/Event List */}
            <View style={styles.holidayList}>
              <View style={[styles.holidayItem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.holidayDateBox, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.holidayDateDay, { color: '#ef4444' }]}>१</Text>
                  <Text style={[styles.holidayDateMonth, { color: '#ef4444' }]}>चैत्र</Text>
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={[styles.holidayTitle, { color: c.foreground }]}>होली पुर्णिमा (फागु पुर्णिमा)</Text>
                  <Text style={[styles.holidayDesc, { color: c.mutedForeground }]}>सार्वजनिक बिदा - पहाडी तथा हिमाली जिल्लाहरूमा</Text>
                </View>
              </View>

              <View style={[styles.holidayItem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.holidayDateBox, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.holidayDateDay, { color: '#ef4444' }]}>२</Text>
                  <Text style={[styles.holidayDateMonth, { color: '#ef4444' }]}>चैत्र</Text>
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={[styles.holidayTitle, { color: c.foreground }]}>होली (तराई/मधेस)</Text>
                  <Text style={[styles.holidayDesc, { color: c.mutedForeground }]}>सार्वजनिक बिदा - तराईका जिल्लाहरूमा</Text>
                </View>
              </View>

              <View style={[styles.holidayItem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.holidayDateBox, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.holidayDateDay, { color: '#0ea5e9' }]}>८</Text>
                  <Text style={[styles.holidayDateMonth, { color: '#0ea5e9' }]}>चैत्र</Text>
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={[styles.holidayTitle, { color: c.foreground }]}>अन्तर्राष्ट्रिय जातीय विभेद उन्मुलन दिवस</Text>
                  <Text style={[styles.holidayDesc, { color: c.mutedForeground }]}>विशेष दिवस</Text>
                </View>
              </View>

              <View style={[styles.holidayItem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.holidayDateBox, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.holidayDateDay, { color: '#ef4444' }]}>२६</Text>
                  <Text style={[styles.holidayDateMonth, { color: '#ef4444' }]}>चैत्र</Text>
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={[styles.holidayTitle, { color: c.foreground }]}>रामनवमी</Text>
                  <Text style={[styles.holidayDesc, { color: c.mutedForeground }]}>सार्वजनिक बिदा</Text>
                </View>
              </View>

              <View style={[styles.holidayItem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.holidayDateBox, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.holidayDateDay, { color: '#ef4444' }]}>३०</Text>
                  <Text style={[styles.holidayDateMonth, { color: '#ef4444' }]}>चैत्र</Text>
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={[styles.holidayTitle, { color: c.foreground }]}>नयाँ वर्ष पूर्वसन्ध्या</Text>
                  <Text style={[styles.holidayDesc, { color: c.mutedForeground }]}>वर्षको अन्तिम दिन</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </RNSafeAreaView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Tab bar padding
  },
  headerArea: {
    backgroundColor: '#da1c22',
    // paddingTop is now set dynamically via useSafeAreaInsets — see inline style below
    paddingBottom: 80,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleNep: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  titleEng: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  calendarIconBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  dateDayNep: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    marginRight: 8,
    lineHeight: 48,
  },
  dateMonthNep: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  dateEng1: {
    color: '#fee2e2',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateEng2: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '500',
  },
  weatherCol: {
    alignItems: 'flex-end',
  },
  weatherIcon: {
    marginBottom: 4,
  },
  temperature: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  weatherText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    paddingHorizontal: 16,
    marginTop: -50,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  viewFullText: {
    color: '#da1c22',
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  gridDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 16,
  },
  cell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cellText: {
    fontSize: 15,
    fontWeight: '600',
  },
  holidayCell: {
    borderRadius: 12,
    borderWidth: 1,
  },
  holidayText: {
    color: '#da1c22',
    marginTop: 2,
  },
  holidayLabel: {
    color: '#da1c22',
    fontSize: 7,
    fontWeight: '700',
    marginTop: 2,
  },
  todayCell: {
    backgroundColor: '#da1c22',
    borderRadius: 12,
    shadowColor: '#da1c22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  todayText: {
    color: '#fff',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  panchangContainer: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  panchangRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  panchangBox: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  panchangBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  panchangBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  panchangBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  panchangBoxSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  sunBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 14,
  },
  sunLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  sunTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickLinkItem: {
    width: '22%',
    aspectRatio: 0.8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickLinkIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLinkText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  newsList: {
    gap: 16,
  },
  newsCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  newsImgPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  newsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  newsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  newsDesc: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  newsTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  holidayList: {
    paddingVertical: 16,
    gap: 12,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  holidayDateBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayDateDay: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  holidayDateMonth: {
    fontSize: 12,
    fontWeight: '700',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  holidayDesc: {
    fontSize: 13,
  },
});
