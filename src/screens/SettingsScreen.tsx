
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Switch, Linking, Modal, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogoIcon, LogoText } from '../components/Logo';
import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/storeLinks';
import { getTrackingConsent, setTrackingConsent } from '../utils/analytics';

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout, user, token } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [adTrackingEnabled, setAdTrackingEnabled] = useState(getTrackingConsent() === 'granted');
  const setPartnerOffersMutation = useMutation(api.auth.setPartnerOffers);
  const [partnerOffers, setPartnerOffers] = useState(false);

  // `user` is null on the first frames and again whenever the Convex verifyToken
  // query re-subscribes, so mirror it rather than initialising from it once.
  useEffect(() => {
    if (user) setPartnerOffers(user.partnerOffersOptIn ?? false);
  }, [user?.partnerOffersOptIn]);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

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
    headerTitle: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.l,
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.m,
      letterSpacing: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.l,
      marginBottom: theme.spacing.s,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingTextContainer: {
      marginLeft: theme.spacing.m,
      flex: 1,
    },
    settingText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    settingSubtext: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.destructive,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.xl,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    logoutText: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textLight,
      marginLeft: theme.spacing.s,
    },
    userInfo: {
      backgroundColor: isDark ? theme.colors.card : theme.brand.pinkSoft,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      marginBottom: theme.spacing.l,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    userAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark ? theme.colors.background : theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userDetails: {
      marginLeft: theme.spacing.m,
      flex: 1,
    },
    userName: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    userEmail: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
    },
    inviteCode: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.primary,
      marginTop: 4,
    },
  }), [theme, isDark]);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all local data? This will delete your profile and liked names from this device. Your account on the server will remain.',
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
                'bumpmatch_partner_data',
                'bumpmatch_theme_preference',
              ]);
              Alert.alert('Success', 'Local data cleared successfully');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
            } catch (e) {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:ai@sherbetagency.com?subject=BumpMatch Support');
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: APP_STORE_URL,
      android: PLAY_STORE_URL,
    });
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(() => {
        Alert.alert('Error', 'Could not open the store.');
      });
    }
  };

  const SettingItem = ({
    icon,
    iconColor = theme.colors.primary,
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false
  }: {
    icon: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={danger ? theme.colors.destructive : iconColor} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingText, { color: theme.colors.text }, danger && { color: theme.colors.destructive }]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtext}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Settings Content */}
      <ScrollView style={styles.content}>
        {/* User Info */}
        {user && (
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.firstName} {user.surname}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.inviteCode}>Code: {user.inviteCode}</Text>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your information"
            onPress={() => navigation.navigate('Profile')}
          />

          <SettingItem
            icon="people-outline"
            title="Partner Settings"
            subtitle={user?.partnerId ? "Connected" : "Not connected"}
            onPress={() => navigation.navigate('Partner')}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textLight}
              />
            }
          />

          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textLight}
              />
            }
          />

          {/* Withdrawing consent is promised in Section 7f of the privacy
              policy, so it has to be actionable from inside the app. */}
          <SettingItem
            icon="megaphone-outline"
            title="Ad Measurement"
            subtitle={adTrackingEnabled
              ? 'Helping us measure our ads'
              : 'Off — the app works the same'}
            rightElement={
              <Switch
                value={adTrackingEnabled}
                onValueChange={async (next) => {
                  setAdTrackingEnabled(next);
                  await setTrackingConsent(next);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textLight}
              />
            }
          />

          {/* Section 5 of the privacy policy promises this is reversible at any
              time, so it has to live here rather than behind a support email. */}
          <SettingItem
            icon="pricetag-outline"
            title="Partner Offers"
            subtitle={partnerOffers
              ? 'Sharing your name and email with partner brands'
              : 'Off — nothing shared with partners'}
            rightElement={
              <Switch
                value={partnerOffers}
                onValueChange={async (next) => {
                  setPartnerOffers(next);
                  try {
                    if (token) await setPartnerOffersMutation({ token, optIn: next });
                  } catch (e) {
                    setPartnerOffers(!next); // put the switch back if it did not save
                    Alert.alert('Could not save', 'Please try again.');
                  }
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.textLight}
              />
            }
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <SettingItem
            icon="help-circle-outline"
            title="Help & FAQ"
            onPress={() => setHelpModalVisible(true)}
          />

          <SettingItem
            icon="mail-outline"
            title="Contact Support"
            onPress={handleContactSupport}
          />

          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => setPrivacyModalVisible(true)}
          />

          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => setTermsModalVisible(true)}
          />
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <SettingItem
            icon="trash-outline"
            title="Clear Local Data"
            subtitle="Remove cached data from device"
            onPress={handleClearData}
            danger
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <SettingItem
            icon="information-circle-outline"
            title="Version"
            subtitle={appVersion}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.textLight} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Help & FAQ Modal */}
      <Modal visible={helpModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <Text style={{ fontFamily: theme.typography.fontFamilyDisplay, fontSize: 20, color: theme.colors.text }}>Help & FAQ</Text>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text }}>How does </Text>
              <LogoText size="small" showTagline={false} style={{ height: 18, width: 65 }} />
              <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text }}> work?</Text>
            </View>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20, lineHeight: 20 }}>
              Swipe right on names you love, left on names you don't. When you and your partner both like the same name, it's a match!
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>How do I connect with my partner?</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20, lineHeight: 20 }}>
              Go to Partner Settings and share your invite code. Your partner enters this code in their app to link your accounts.
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>Can I change my liked names?</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20, lineHeight: 20 }}>
              Yes! Visit your Liked Names list from the menu to review and remove any names you've previously liked.
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>How do I delete my account?</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20, lineHeight: 20 }}>
              Go to your Profile page and tap "Delete Account" at the bottom to permanently delete your account and all associated data.
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>Need more help?</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 20, lineHeight: 20 }}>
              Contact us at ai@sherbetagency.com and we'll get back to you as soon as possible.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <Text style={{ fontFamily: theme.typography.fontFamilyDisplay, fontSize: 20, color: theme.colors.text }}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 12, color: theme.colors.grey, marginBottom: 16 }}>Last updated: August 2026</Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>1. Information We Collect</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              We collect the following information when you create an account:{'\n'}- Name and email address{'\n'}- Age and parental status{'\n'}- Baby name preferences (likes and dislikes){'\n'}- Partner connection data
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>2. How We Use Your Information</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              Your information is used to:{'\n'}- Provide the name matching service{'\n'}- Connect you with your partner{'\n'}- Save your preferences and liked names{'\n'}- Improve the app experience
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>3. Data Storage & Third-Party Services</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              Your data is stored securely using Convex, our cloud backend provider. Data is stored on servers located in the United States. We never sell your pregnancy information, due date, or the names you swipe on. We only share your name and contact details with partner brands if you switch that on yourself — it is off by default.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>4. Analytics & Advertising</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              We use Google Analytics to understand how the app is used, and we advertise Bump Match on Meta (Facebook and Instagram). To measure whether those adverts work, the app tells Meta when you install it, create an account, start swiping, connect a partner, or reach a match, along with a scrambled version of your email and name.{'\n\n'}We never send Google or Meta your pregnancy stage, due date, or the names you swipe on.{'\n\n'}On iPhone we ask your permission before using your device's advertising identifier. If you say no, the app works exactly the same. You can change your mind anytime in iOS Settings, or on Android under Settings → Google → Ads. To be excluded from our advertising audiences entirely, email ai@sherbetagency.com.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>5. Your Rights</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              You have the right to:{'\n'}- Access your personal data{'\n'}- Request deletion of your data{'\n'}- Export your data{'\n'}- Opt out of communications{'\n\n'}To exercise any of these rights, contact us at ai@sherbetagency.com.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>6. Data Security</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              We implement industry-standard security measures to protect your data, including encryption in transit and at rest. Passwords are hashed and never stored in plain text.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>7. Children's Privacy</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              BumpMatch is intended for users aged 18 and older. We do not knowingly collect data from children under 13.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>8. Changes to This Policy</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy within the app.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>9. Contact Us</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 40, lineHeight: 20 }}>
              If you have questions about this Privacy Policy, contact us at ai@sherbetagency.com.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal visible={termsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <Text style={{ fontFamily: theme.typography.fontFamilyDisplay, fontSize: 20, color: theme.colors.text }}>Terms of Service</Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 12, color: theme.colors.grey, marginBottom: 16 }}>Last updated: January 2026</Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>1. Acceptance of Terms</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              By using BumpMatch, you agree to these Terms of Service. If you do not agree, please do not use the app.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>2. Description of Service</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              BumpMatch is a baby name discovery app that allows expecting parents and partners to swipe through baby names and find matches with their partner.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>3. User Accounts</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>4. Acceptable Use</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              You agree not to misuse the service, attempt to gain unauthorized access, or use the app for any unlawful purpose.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>5. Termination</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time by contacting ai@sherbetagency.com.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>6. Limitation of Liability</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              BumpMatch is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>7. Changes to Terms</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 16, lineHeight: 20 }}>
              We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
            </Text>

            <Text style={{ fontFamily: theme.typography.fontFamilyBold, fontSize: 16, color: theme.colors.text, marginBottom: 8 }}>8. Contact</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: 14, color: theme.colors.grey, marginBottom: 40, lineHeight: 20 }}>
              For questions about these terms, contact us at ai@sherbetagency.com.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
