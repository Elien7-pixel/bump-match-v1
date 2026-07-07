
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'Profile' | 'LikedNames' | 'Settings' | 'Partner' | 'Landing' | 'Dictionary') => void;
  onSuggestName?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ visible, onClose, onNavigate, onSuggestName }) => {
  const { theme, isDark } = useTheme();

  const handleNavigation = (screen: 'Profile' | 'LikedNames' | 'Settings' | 'Partner' | 'Dictionary') => {
    onNavigate(screen);
    onClose();
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
              await AsyncStorage.removeItem('bumpmatch_onboarding_completed');
              onClose();
              onNavigate('Landing');
            } catch (e) {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const styles = React.useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(74, 68, 89, 0.45)',
    },
    drawer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '60%',
      width: '100%',
      zIndex: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 10,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.l,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoMark: {
      width: 30,
      height: 30,
      marginRight: theme.spacing.s,
    },
    title: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
    },
    menuItems: {
      padding: theme.spacing.m,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.m,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.s,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    iconPill: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.round,
      backgroundColor: isDark ? 'rgba(170, 160, 221, 0.22)' : theme.brand.purpleSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: {
      flex: 1,
      marginLeft: theme.spacing.m,
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.m,
    },
    logoutItem: {
      backgroundColor: isDark ? 'rgba(232, 106, 106, 0.18)' : theme.brand.pinkSoft,
      borderColor: isDark ? 'rgba(232, 106, 106, 0.35)' : theme.brand.pinkSoft,
    },
    logoutIconPill: {
      backgroundColor: isDark ? 'rgba(232, 106, 106, 0.22)' : theme.colors.card,
    },
    logoutText: {
      color: theme.colors.destructive,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
  }), [theme, isDark]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.drawer}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image
                  source={require('../../assets/brand/logo-mark-purple.png')}
                  style={styles.logoMark}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Menu</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Profile')}
              >
                <View style={styles.iconPill}>
                  <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuText}>Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('LikedNames')}
              >
                <View style={styles.iconPill}>
                  <Ionicons name="heart-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuText}>Liked Names</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Partner')}
              >
                <View style={styles.iconPill}>
                  <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuText}>Partner</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Dictionary')}
              >
                <View style={styles.iconPill}>
                  <Ionicons name="book-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuText}>Name Dictionary</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onSuggestName?.();
                }}
              >
                <View style={styles.iconPill}>
                  <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuText}>Suggest a Name</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Settings')}
              >
                <View style={styles.iconPill}>
                  <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <View style={[styles.iconPill, styles.logoutIconPill]}>
                  <Ionicons name="log-out-outline" size={22} color={theme.colors.destructive} />
                </View>
                <Text style={[styles.menuText, styles.logoutText]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};
