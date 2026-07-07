import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, calculateAge } from '../utils/date';
import { Brand } from '../theme/designTokens';


const AVATAR_OPTIONS = [
  { id: 'default', icon: 'person', color: Brand.purpleDeep },
  { id: 'heart', icon: 'heart', color: Brand.pinkDeep },
  { id: 'star', icon: 'star', color: Brand.yellowDeep },
  { id: 'flower', icon: 'flower', color: Brand.tealDeep },
  { id: 'happy', icon: 'happy', color: Brand.purple },
  { id: 'sunny', icon: 'sunny', color: Brand.pink },
];

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
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
    heritage?: string[];
    dueDate?: string;
  } | null>(null);

  // Editable fields
  const [editFirstName, setEditFirstName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState<'mom' | 'dad' | 'partner'>('mom');
  const [editStatus, setEditStatus] = useState('');
  const [editAvatar, setEditAvatar] = useState('default');
  const [editHeritage, setEditHeritage] = useState<string[]>([]);
  const [editDueDate, setEditDueDate] = useState('');
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

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
      fontFamily: theme.typography.fontFamilyDisplay,
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
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    infoLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    labelText: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      marginLeft: theme.spacing.s,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    valueText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    label: {
      fontFamily: theme.typography.fontFamilyMedium,
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
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
      fontFamily: theme.typography.fontFamilySemiBold,
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
      backgroundColor: isDark ? theme.colors.card : theme.brand.purpleSoft,
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
      color: isDark ? theme.colors.primary : theme.brand.purpleDeep,
      marginLeft: theme.spacing.s,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? theme.colors.card : theme.brand.pinkSoft,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xxl,
    },
    deleteButtonText: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.destructive,
      marginLeft: theme.spacing.s,
    },
    heritageContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: theme.spacing.s,
    },
    heritageChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.brand.purpleSoft,
      backgroundColor: theme.brand.purpleSoft,
    },
    heritageChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    heritageChipText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 12,
      color: theme.brand.ink,
    },
    heritageChipTextSelected: {
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    heritageDisplay: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    heritageTag: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: theme.borderRadius.round,
      backgroundColor: theme.brand.tealSoft,
    },
    heritageTagText: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 11,
      color: theme.brand.tealDeep,
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
        age: convexProfile.dateOfBirth,
        gender: convexProfile.gender,
        status: convexProfile.status,
        avatar: 'default', // Avatar stored locally for now
      });
      setEditFirstName(convexProfile.firstName || '');
      setEditSurname(convexProfile.surname || '');
      setEditAge(convexProfile.dateOfBirth || '');
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
        setEditHeritage(data.heritage || []);
        setEditDueDate(data.dueDate || '');
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
      heritage: editHeritage,
      dueDate: editStatus === 'Expecting soon' ? editDueDate : undefined,
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
      setEditHeritage(profile.heritage || []);
      setEditDueDate(profile.dueDate || '');
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
              placeholder="e.g. Naledi"
              autoCapitalize="words"
            />

            <Input
              label="Last Name"
              value={editSurname}
              onChangeText={setEditSurname}
              placeholder="e.g. Ndlovu"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              onPress={() => setShowDobPicker(true)}
              style={{ backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.m, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: theme.colors.border }}
            >
              <Text style={{ color: editAge ? theme.colors.text : theme.colors.grey, fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                {editAge ? formatDate(editAge) : 'Select your date of birth'}
              </Text>
            </TouchableOpacity>
            {showDobPicker && (
              <DateTimePicker
                value={editAge ? new Date(editAge) : new Date(1995, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={new Date(1940, 0, 1)}
                onChange={(event, selected) => {
                  if (Platform.OS === 'android') setShowDobPicker(false);
                  if (selected) setEditAge(selected.toISOString());
                }}
              />
            )}
            {showDobPicker && Platform.OS === 'ios' && (
              <TouchableOpacity onPress={() => setShowDobPicker(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 15 }}>Done</Text>
              </TouchableOpacity>
            )}

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
              {['Expecting soon', 'Planning ahead'].map((s) => (
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

            {editStatus === 'Expecting soon' && (
              <>
                <Text style={styles.label}>When are you expecting?</Text>
                <TouchableOpacity
                  onPress={() => setShowDueDatePicker(true)}
                  style={{ backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.m, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: theme.colors.border }}
                >
                  <Text style={{ color: editDueDate ? theme.colors.text : theme.colors.grey, fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                    {editDueDate
                      ? formatDate(editDueDate)
                      : 'Select your due date'}
                  </Text>
                </TouchableOpacity>
                {showDueDatePicker && (
                  <DateTimePicker
                    value={editDueDate ? new Date(editDueDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000)}
                    onChange={(event, selected) => {
                      if (Platform.OS === 'android') setShowDueDatePicker(false);
                      if (selected) setEditDueDate(selected.toISOString());
                    }}
                  />
                )}
                {showDueDatePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowDueDatePicker(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilySemiBold, fontSize: 15 }}>Done</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <Text style={styles.label}>Cultural Heritage (select multiple)</Text>
            <View style={styles.heritageContainer}>
              {['English', 'Afrikaans', 'isiZulu', 'isiXhosa', 'isiNdebele', 'Sepedi', 'Sesotho', 'Setswana', 'siSwati', 'Tshivenda', 'Xitsonga', 'Irish', 'Italian', 'Korean', 'Spanish', 'German', 'Portuguese', 'Greek', 'Latin'].map((h) => {
                const selected = editHeritage.includes(h);
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.heritageChip, selected && styles.heritageChipSelected]}
                    onPress={() => {
                      if (selected) {
                        setEditHeritage(editHeritage.filter(x => x !== h));
                      } else {
                        setEditHeritage([...editHeritage, h]);
                      }
                    }}
                  >
                    <Text style={[styles.heritageChipText, selected && styles.heritageChipTextSelected]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
                  <Text style={styles.labelText}>Date of Birth</Text>
                </View>
                <Text style={styles.valueText}>
                  {(profile as any).age
                    ? (() => {
                        const formatted = formatDate((profile as any).age);
                        if (!formatted) return 'Not set';
                        const years = calculateAge((profile as any).age);
                        return years !== null ? `${formatted} (${years} yrs)` : formatted;
                      })()
                    : 'Not set'}
                </Text>
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
                {profile.status === 'Expecting soon' && profile.dueDate ? (
                  <Text style={[styles.valueText, { fontSize: 13, color: theme.colors.grey, marginTop: 4 }]}>
                    Due: {formatDate(profile.dueDate)}
                  </Text>
                ) : null}
              </View>

              {profile.heritage && profile.heritage.length > 0 && (
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="globe-outline" size={20} color={theme.colors.grey} />
                    <Text style={styles.labelText}>Heritage</Text>
                  </View>
                  <View style={styles.heritageDisplay}>
                    {profile.heritage.map((h) => (
                      <View key={h} style={styles.heritageTag}>
                        <Text style={styles.heritageTagText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

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
                <Ionicons name="trash-outline" size={24} color={theme.colors.destructive} />
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
        <View style={{ flex: 1, backgroundColor: 'rgba(74, 68, 89, 0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.l, padding: 24 }}>
            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 20, color: theme.colors.text, marginBottom: 8 }}>
              Confirm Deletion
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20 }}>
              Enter your password to permanently delete your account.
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.m,
                padding: 14,
                fontSize: 16,
                fontFamily: theme.typography.fontFamily,
                color: theme.colors.text,
                borderWidth: 1,
                borderColor: theme.colors.border,
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
                style={{ flex: 1, padding: 14, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}
                onPress={() => { setDeleteModalVisible(false); setIsDeleting(false); }}
                disabled={isDeleting}
              >
                <Text style={{ fontFamily: theme.typography.fontFamilySemiBold, fontSize: 16, color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.destructive, alignItems: 'center', opacity: isDeleting ? 0.6 : 1 }}
                onPress={confirmDeleteAccount}
                disabled={isDeleting || !deletePassword.trim()}
              >
                <Text style={{ fontFamily: theme.typography.fontFamilySemiBold, fontSize: 16, color: theme.colors.textLight }}>
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
