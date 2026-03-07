import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';

export default function SettingsScreen() {
  const { c, mode, toggle } = useTheme();
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const [pauseNotifs, setPauseNotifs] = useState(false);
  const isDark = mode === 'dark';

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const openTerms = () => {
    Linking.openURL('https://guffgaff.app/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://guffgaff.app/privacy');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Row */}
        <TouchableOpacity
          style={[styles.profileRow, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push('/profile/edit' as any)}
          activeOpacity={0.7}
        >
          <View style={styles.profileAvatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarFb, { backgroundColor: c.muted }]}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.foreground }}>
                  {profile?.full_name?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: c.foreground }]}>
              {profile?.full_name || 'Your Name'}
            </Text>
            <Text style={[styles.profileUsername, { color: c.mutedForeground }]}>
              @{profile?.username || 'username'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
        </TouchableOpacity>

        {/* Settings List */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          {/* Pause Notifications */}
          <View style={[styles.settingRow, { borderBottomColor: c.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#c6f740' + '22' }]}>
                <Ionicons name="notifications-off-outline" size={18} color="#c6f740" />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>Pause notifications</Text>
            </View>
            <Switch
              value={pauseNotifs}
              onValueChange={setPauseNotifs}
              trackColor={{ false: c.border, true: '#c6f740' }}
              thumbColor="#fff"
            />
          </View>

          {/* General Settings */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: c.border }]}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: c.mutedForeground + '15' }]}>
                <Ionicons name="settings-outline" size={18} color={c.mutedForeground} />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>General settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </TouchableOpacity>

          {/* Dark Mode */}
          <View style={[styles.settingRow, { borderBottomColor: c.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#8b5cf6' + '22' }]}>
                <Ionicons name="moon-outline" size={18} color="#8b5cf6" />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>Dark mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: c.border, true: '#8b5cf6' }}
              thumbColor="#fff"
            />
          </View>

          {/* Language */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: c.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#3b82f6' + '22' }]}>
                <Ionicons name="language-outline" size={18} color="#3b82f6" />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: c.mutedForeground }]}>English</Text>
              <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
            </View>
          </TouchableOpacity>

          {/* My Contacts */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#22c55e' + '22' }]}>
                <Ionicons name="people-outline" size={18} color="#22c55e" />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>My Contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          {/* FAQ */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: c.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#f59e0b' + '22' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#f59e0b" />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </TouchableOpacity>

          {/* Terms of service */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: c.border }]}
            onPress={openTerms}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: c.mutedForeground + '15' }]}>
                <Ionicons name="document-text-outline" size={18} color={c.mutedForeground} />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>Terms of service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </TouchableOpacity>

          {/* User policy */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={openPrivacy}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: c.mutedForeground + '15' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={c.mutedForeground} />
              </View>
              <Text style={[styles.settingLabel, { color: c.foreground }]}>User policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: c.border }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: c.mutedForeground }]}>
          GuffGaff v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  scrollContent: {
    paddingBottom: 100,
    paddingTop: 16,
  },

  /* Profile Row */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 14,
    marginBottom: 20,
  },
  profileAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileAvatarFb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileUsername: {
    fontSize: 13,
    marginTop: 1,
  },

  /* Section */
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginBottom: 20,
  },

  /* Setting Row */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 13,
  },

  /* Log Out */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Version */
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
});
