
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppTokens } from '../theme/designTokens';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data? This will delete your profile and liked names.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'bumpmatch_user_profile',
                'bumpmatch_liked_names',
                'bumpmatch_onboarding_completed',
              ]);
              Alert.alert('Success', 'All data cleared successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppTokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Settings Content */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.settingText, { color: '#EF4444' }]}>Clear All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={AppTokens.colors.grey} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color={AppTokens.colors.primary} />
              <View>
                <Text style={styles.settingText}>Version</Text>
                <Text style={styles.settingSubtext}>1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="heart-outline" size={24} color={AppTokens.colors.primary} />
              <View>
                <Text style={styles.settingText}>Made with ❤️</Text>
                <Text style={styles.settingSubtext}>BumpMatch</Text>
              </View>
            </View>
          </View>
        </View>
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
  section: {
    marginBottom: AppTokens.spacing.xl,
  },
  sectionTitle: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.small,
    color: AppTokens.colors.grey,
    textTransform: 'uppercase',
    marginBottom: AppTokens.spacing.m,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: AppTokens.spacing.l,
    borderRadius: AppTokens.borderRadius.m,
    marginBottom: AppTokens.spacing.s,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.text,
    marginLeft: AppTokens.spacing.m,
  },
  settingSubtext: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.small,
    color: AppTokens.colors.grey,
    marginLeft: AppTokens.spacing.m,
    marginTop: 2,
  },
});
