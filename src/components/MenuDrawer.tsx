
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Alert } from 'react-native';
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '60%',
      width: '100%',
      zIndex: 1,
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
    title: {
      fontFamily: theme.typography.fontFamilyBold,
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
      marginBottom: theme.spacing.s,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    menuText: {
      flex: 1,
      marginLeft: theme.spacing.m,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.m,
    },
    logoutItem: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
    },
    logoutText: {
      color: isDark ? '#FECACA' : '#EF4444',
      fontFamily: theme.typography.fontFamilyBold,
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
              <Text style={styles.title}>Menu</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Profile')}
              >
                <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.menuText}>Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('LikedNames')}
              >
                <Ionicons name="heart-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.menuText}>Liked Names</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Partner')}
              >
                <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.menuText}>Partner</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Dictionary')}
              >
                <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
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
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.menuText}>Suggest a Name</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.menuText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.grey} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={isDark ? '#FECACA' : '#EF4444'} />
                <Text style={[styles.menuText, styles.logoutText]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};
