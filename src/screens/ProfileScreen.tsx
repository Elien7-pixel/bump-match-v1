import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AVATAR_OPTIONS = [
  { id: 'default', icon: 'person', color: '#3B82F6' },
  { id: 'heart', icon: 'heart', color: '#EC4899' },
  { id: 'star', icon: 'star', color: '#F59E0B' },
  { id: 'flower', icon: 'flower', color: '#10B981' },
  { id: 'happy', icon: 'happy', color: '#8B5CF6' },
  { id: 'sunny', icon: 'sunny', color: '#F97316' },
];

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user, token, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [profile, setProfile] = useState<{
    firstName?: string;
    surname: string;
    age?: string;
    gender: string;
    status: string;
    avatar?: string;
  } | null>(null);

  // Editable fields
  const [editFirstName, setEditFirstName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState<'mom' | 'dad' | 'partner'>('mom');
  const [editStatus, setEditStatus] = useState('');
  const [editAvatar, setEditAvatar] = useState('default');

  // Convex query for profile
  const convexProfile = useQuery(
    api.users.getProfile,
    token ? { token } : "skip"
  );

  // Convex mutation for updating profile
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const deleteAccountMutation = useMutation(api.deleteAccount.deleteAccount);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.m,
    },
    backButton: {
      padding: theme.spacing.s,
    },
    editButton: {
      padding: theme.spacing.s,
    },
    headerTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.l,
    },
    avatarContainer: {
      alignItems: 'center',
      marginVertical: theme.spacing.xl,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarHint: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      marginTop: theme.spacing.s,
    },
    avatarSelection: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.l,
      gap: 12,
    },
    avatarOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
    },
    avatarOptionSelected: {
      borderWidth: 3,
      transform: [{ scale: 1.1 }],
    },
    editContainer: {
      paddingBottom: theme.spacing.xxl,
    },
    infoContainer: {
      marginTop: theme.spacing.l,
    },
    infoRow: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.l,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    infoLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    labelText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      marginLeft: theme.spacing.s,
      textTransform: 'uppercase',
    },
    valueText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.text,
      marginBottom: theme.spacing.s,
      marginTop: theme.spacing.m,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    option: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.grey,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
    },
    statusContainer: {
      flexDirection: 'column',
    },
    statusOption: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.grey,
      alignItems: 'center',
      marginBottom: 8,
    },
    optionSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionText: {
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
    },
    optionTextSelected: {
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamilyBold,
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: theme.spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.xxl,
    },
    emptyText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.grey,
    },
    inviteCodeBanner: {
      backgroundColor: isDark ? '#1E3A8A' : '#E0F2FE',
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginTop: theme.spacing.l,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inviteCodeText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
    },
    inviteCodeValue: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.primary,
      marginLeft: theme.spacing.s,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xxl,
    },
    deleteButtonText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: isDark ? '#FECACA' : '#EF4444',
      marginLeft: theme.spacing.s,
    },
  }), [theme, isDark]);

  useEffect(() => {
    loadProfile();
  }, []);

  // Sync with Convex data
  useEffect(() => {
    if (convexProfile) {
      setProfile({
        firstName: convexProfile.firstName,
        surname: convexProfile.surname,
        age: convexProfile.age,
        gender: convexProfile.gender,
        status: convexProfile.status,
        avatar: 'default', // Avatar stored locally for now
      });
      setEditFirstName(convexProfile.firstName || '');
      setEditSurname(convexProfile.surname || '');
      setEditAge(convexProfile.age || '');
      setEditGender(convexProfile.gender || 'mom');
      setEditStatus(convexProfile.status || '');
    }
  }, [convexProfile]);

  const loadProfile = async () => {
    try {
      const json = await AsyncStorage.getItem('bumpmatch_user_profile');
      if (json) {
        const data = JSON.parse(json);
        setProfile(data);
        setEditFirstName(data.firstName || '');
        setEditSurname(data.surname || '');
        setEditAge(data.age || '');
        setEditGender(data.gender || 'mom');
        setEditStatus(data.status || '');
        setEditAvatar(data.avatar || 'default');
      }
    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

  const handleSave = async () => {
    if (!editSurname.trim()) {
      Alert.alert('Required', 'Please enter your last name.');
      return;
    }

    setIsSaving(true);

    const updatedProfile = {
      ...profile,
      firstName: editFirstName,
      surname: editSurname,
      age: editAge,
      gender: editGender,
      status: editStatus,
      avatar: editAvatar,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save to local storage
      await AsyncStorage.setItem('bumpmatch_user_profile', JSON.stringify(updatedProfile));

      // Save to Convex if authenticated
      if (token) {
        await updateProfileMutation({
          token,
          firstName: editFirstName,
          surname: editSurname,
          age: editAge,
          gender: editGender,
          status: editStatus,
        });
        refreshUser();
      }

      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      console.log('Error saving profile', e);
      Alert.alert('Error', e.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditFirstName(profile.firstName || '');
      setEditSurname(profile.surname || '');
      setEditAge((profile as any).age || '');
      setEditGender((profile.gender as any) || 'mom');
      setEditStatus(profile.status || '');
      setEditAvatar(profile.avatar || 'default');
    }
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This will remove all your data including your profile, liked names, and partner connections. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            setDeletePassword('');
            setDeleteModalVisible(true);
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim() || !user?.email) return;
    setIsDeleting(true);
    try {
      const result = await deleteAccountMutation({
        email: user.email,
        password: deletePassword,
      });
      if (result.success) {
        setDeleteModalVisible(false);
        await AsyncStorage.multiRemove([
          'bumpmatch_user_profile',
          'bumpmatch_liked_names',
          'bumpmatch_onboarding_completed',
          'bumpmatch_partner_data',
          'bumpmatch_theme_preference',
          'bumpmatch_auth_token',
        ]);
        Alert.alert(
          'Account Deleted',
          'Your account and all data have been permanently deleted.',
          [{
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            }),
          }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to delete account.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCurrentAvatar = () => {
    return AVATAR_OPTIONS.find(a => a.id === editAvatar) || AVATAR_OPTIONS[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: `${getCurrentAvatar().color}20` }]}>
            <Ionicons name={getCurrentAvatar().icon as any} size={60} color={getCurrentAvatar().color} />
          </View>
          {isEditing && (
            <Text style={styles.avatarHint}>Tap an icon below to change</Text>
          )}
        </View>

        {/* Avatar Selection */}
        {isEditing && (
          <View style={styles.avatarSelection}>
            {AVATAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.avatarOption,
                  editAvatar === option.id && styles.avatarOptionSelected,
                  { borderColor: option.color }
                ]}
                onPress={() => setEditAvatar(option.id)}
              >
                <Ionicons name={option.icon as any} size={28} color={option.color} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Profile Info */}
        {isEditing ? (
          <View style={styles.editContainer}>
            <Input
              label="First Name"
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="e.g. Sarah"
            />

            <Input
              label="Last Name"
              value={editSurname}
              onChangeText={setEditSurname}
              placeholder="e.g. Smith"
            />

            <Input
              label="Age"
              value={editAge}
              onChangeText={setEditAge}
              placeholder="e.g. 28"
              keyboardType="numeric"
            />

            <Text style={styles.label}>I am a...</Text>
            <View style={styles.row}>
              {(['mom', 'dad', 'partner'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.option, editGender === g && styles.optionSelected]}
                  onPress={() => setEditGender(g)}
                >
                  <Text style={[styles.optionText, editGender === g && styles.optionTextSelected]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {['Expecting soon', 'Just found out', 'Have child'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, editStatus === s && styles.optionSelected]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.optionText, editStatus === s && styles.optionTextSelected]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={handleCancel}
                style={{ flex: 1, marginRight: 8 }}
                disabled={isSaving}
              />
              <Button
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                style={{ flex: 1 }}
                disabled={isSaving}
              />
            </View>
          </View>
        ) : (
          profile && (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.grey} />
                  <Text style={styles.labelText}>Name</Text>
                </View>
                <Text style={styles.valueText}>
                  {profile.firstName} {profile.surname}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.grey} />
                  <Text style={styles.labelText}>Age</Text>
                </View>
                <Text style={styles.valueText}>{(profile as any).age || 'Not set'}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="people-outline" size={20} color={theme.colors.grey} />
                  <Text style={styles.labelText}>Role</Text>
                </View>
                <Text style={styles.valueText}>
                  {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="heart-outline" size={20} color={theme.colors.grey} />
                  <Text style={styles.labelText}>Status</Text>
                </View>
                <Text style={styles.valueText}>{profile.status || 'Not set'}</Text>
              </View>

              {/* Invite Code Banner */}
              {user?.inviteCode && (
                <View style={styles.inviteCodeBanner}>
                  <Ionicons name="qr-code-outline" size={24} color={theme.colors.primary} />
                  <View style={{ marginLeft: theme.spacing.m }}>
                    <Text style={styles.inviteCodeText}>Your Invite Code</Text>
                    <Text style={styles.inviteCodeValue}>{user.inviteCode}</Text>
                  </View>
                </View>
              )}

              {/* Delete Account Button */}
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={24} color={isDark ? '#FECACA' : '#EF4444'} />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {!profile && !isEditing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No profile data found</Text>
          </View>
        )}
      </ScrollView>

      {/* Delete Account Password Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors.card, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 20, color: theme.colors.text, marginBottom: 8 }}>
              Confirm Deletion
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20 }}>
              Enter your password to permanently delete your account.
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: 10,
                padding: 14,
                fontSize: 16,
                color: theme.colors.text,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB',
                marginBottom: 20,
              }}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.grey}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: theme.colors.background, alignItems: 'center' }}
                onPress={() => { setDeleteModalVisible(false); setIsDeleting(false); }}
                disabled={isDeleting}
              >
                <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', opacity: isDeleting ? 0.6 : 1 }}
                onPress={confirmDeleteAccount}
                disabled={isDeleting || !deletePassword.trim()}
              >
                <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: '#FFFFFF' }}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
