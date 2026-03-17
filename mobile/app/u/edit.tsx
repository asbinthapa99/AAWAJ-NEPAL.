import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';

const AVATAR_SIZE = 120;

export default function EditProfileScreen() {
  const { c } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [bioSubtitle, setBioSubtitle] = useState(profile?.bio_subtitle || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [newAvatar, setNewAvatar] = useState<string | null>(null);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets[0]) {
      setNewAvatar(result.assets[0].uri);
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, bucket: string, path: string) => {
    const ext = uri.split('.').pop() || 'jpg';
    const fileName = `${path}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (newAvatar) {
        avatarUrl = await uploadImage(newAvatar, 'avatars', `${user.id}/avatar`);
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          bio_subtitle: bioSubtitle.trim() || null,
          website: website.trim() || null,
          district: district.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Contact Support', 'Please email support@guffgaff.app to delete your account.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Edit Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Avatar with Camera Badge */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
              <View style={styles.avatarOuter}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: c.muted }]}>
                    <Text style={[styles.avatarLetter, { color: c.foreground }]}>
                      {fullName.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={[styles.fieldsCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <EditField
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your Name"
              c={c}
            />
            <Divider c={c} />
            <EditField
              label="Subtitle"
              value={bioSubtitle}
              onChangeText={setBioSubtitle}
              placeholder="Visual Storyteller & Architect"
              c={c}
            />
            <Divider c={c} />
            <EditField
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              c={c}
              maxLength={200}
            />
            <Divider c={c} />
            <EditField
              label="Email"
              value={user?.email || ''}
              onChangeText={() => {}}
              placeholder="your@email.com"
              c={c}
              editable={false}
            />
            <Divider c={c} />
            <EditField
              label="Username"
              value={`@${username}`}
              onChangeText={() => {}}
              placeholder="@yourname"
              c={c}
              editable={false}
            />
            <Divider c={c} />
            <EditField
              label="Website"
              value={website}
              onChangeText={setWebsite}
              placeholder="yoursite.com"
              c={c}
              keyboardType="url"
              autoCapitalize="none"
            />
            <Divider c={c} />
            <EditField
              label="Location"
              value={district}
              onChangeText={setDistrict}
              placeholder="Kathmandu"
              c={c}
            />
          </View>

          {/* Save Changes */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: '#ef4444' }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Reusable field row ── */
function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  c,
  editable = true,
  maxLength,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  c: any;
  editable?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url' | 'email-address';
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: c.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: editable ? c.foreground : c.mutedForeground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground + '66'}
        editable={editable}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function Divider({ c }: { c: any }) {
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
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
    paddingBottom: 120,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    position: 'relative',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0a0a', // matches dark bg
  },

  /* Fields Card */
  fieldsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 90,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    textAlign: 'right',
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    marginLeft: 18,
  },

  /* Buttons */
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 28,
    backgroundColor: '#c6f740',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
