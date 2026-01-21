
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppTokens } from '../theme/designTokens';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<{
    surname: string;
    gender: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const json = await AsyncStorage.getItem('bumpmatch_user_profile');
      if (json) {
        setProfile(JSON.parse(json));
      }
    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppTokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Content */}
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color={AppTokens.colors.primary} />
          </View>
        </View>

        {profile && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={20} color={AppTokens.colors.grey} />
                <Text style={styles.labelText}>Surname</Text>
              </View>
              <Text style={styles.valueText}>{profile.surname}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="people-outline" size={20} color={AppTokens.colors.grey} />
                <Text style={styles.labelText}>Role</Text>
              </View>
              <Text style={styles.valueText}>{profile.gender}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="heart-outline" size={20} color={AppTokens.colors.grey} />
                <Text style={styles.labelText}>Status</Text>
              </View>
              <Text style={styles.valueText}>{profile.status}</Text>
            </View>
          </View>
        )}

        {!profile && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No profile data found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppTokens.spacing.m,
    paddingTop: AppTokens.spacing.l,
    paddingBottom: AppTokens.spacing.m,
  },
  backButton: {
    padding: AppTokens.spacing.s,
  },
  headerTitle: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h2,
    color: AppTokens.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: AppTokens.spacing.l,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: AppTokens.spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    marginTop: AppTokens.spacing.l,
  },
  infoRow: {
    backgroundColor: 'white',
    padding: AppTokens.spacing.l,
    borderRadius: AppTokens.borderRadius.m,
    marginBottom: AppTokens.spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppTokens.spacing.s,
  },
  labelText: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.small,
    color: AppTokens.colors.grey,
    marginLeft: AppTokens.spacing.s,
    textTransform: 'uppercase',
  },
  valueText: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AppTokens.spacing.xxl,
  },
  emptyText: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.grey,
  },
});
