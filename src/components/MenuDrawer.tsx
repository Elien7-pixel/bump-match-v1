
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTokens } from '../theme/designTokens';

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'Profile' | 'LikedNames' | 'Settings') => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ visible, onClose, onNavigate }) => {
  const handleNavigation = (screen: 'Profile' | 'LikedNames' | 'Settings') => {
    onNavigate(screen);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.drawer}>
          <SafeAreaView style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Menu</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={AppTokens.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleNavigation('Profile')}
              >
                <Ionicons name="person-outline" size={24} color={AppTokens.colors.primary} />
                <Text style={styles.menuText}>Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={AppTokens.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleNavigation('LikedNames')}
              >
                <Ionicons name="heart-outline" size={24} color={AppTokens.colors.primary} />
                <Text style={styles.menuText}>Liked Names</Text>
                <Ionicons name="chevron-forward" size={20} color={AppTokens.colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleNavigation('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color={AppTokens.colors.primary} />
                <Text style={styles.menuText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={AppTokens.colors.grey} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: AppTokens.colors.background,
    borderTopLeftRadius: AppTokens.borderRadius.xl,
    borderTopRightRadius: AppTokens.borderRadius.xl,
    maxHeight: '50%',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AppTokens.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h2,
    color: AppTokens.colors.text,
  },
  menuItems: {
    padding: AppTokens.spacing.m,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppTokens.spacing.m,
    backgroundColor: 'white',
    borderRadius: AppTokens.borderRadius.m,
    marginBottom: AppTokens.spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuText: {
    flex: 1,
    marginLeft: AppTokens.spacing.m,
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.text,
  },
});
