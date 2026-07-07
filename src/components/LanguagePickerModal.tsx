
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLanguages: string[];
  onSelectLanguages: (languages: string[]) => void;
}

const LANGUAGES = [
  'All',
  'Afrikaans',
  'English',
  'German',
  'Greek',
  'Irish',
  'isiNdebele',
  'isiXhosa',
  'isiZulu',
  'Italian',
  'Korean',
  'Latin',
  'Portuguese',
  'Sepedi',
  'Sesotho',
  'Setswana',
  'siSwati',
  'Spanish',
  'Tshivenda',
  'Xitsonga',
];

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  onClose,
  selectedLanguages,
  onSelectLanguages,
}) => {
  const { theme, isDark } = useTheme();

  const isAllSelected = selectedLanguages.includes('All') || selectedLanguages.length === 0;

  const handleToggle = (language: string) => {
    if (language === 'All') {
      onSelectLanguages(['All']);
      return;
    }

    let updated: string[];
    if (isAllSelected) {
      // Switching from All to a specific language
      updated = [language];
    } else if (selectedLanguages.includes(language)) {
      // Deselect this language
      updated = selectedLanguages.filter(l => l !== language);
      if (updated.length === 0) {
        updated = ['All'];
      }
    } else {
      // Add this language
      updated = [...selectedLanguages.filter(l => l !== 'All'), language];
    }
    onSelectLanguages(updated);
  };

  const isSelected = (language: string) => {
    if (language === 'All') return isAllSelected;
    return !isAllSelected && selectedLanguages.includes(language);
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
    modal: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '70%',
      width: '100%',
      zIndex: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
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
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.s,
    },
    list: {
      minHeight: 300,
      paddingBottom: theme.spacing.xl,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      marginHorizontal: theme.spacing.m,
      marginVertical: 4,
      backgroundColor: isDark ? theme.colors.background : theme.brand.purpleSoft,
      borderRadius: theme.borderRadius.round,
    },
    languageItemActive: {
      backgroundColor: theme.colors.primary,
    },
    languageText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    languageTextActive: {
      fontFamily: theme.typography.fontFamilySemiBold,
      color: theme.colors.textLight,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isDark ? theme.colors.border : '#FFFFFF',
      backgroundColor: isDark ? 'transparent' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: theme.colors.textLight,
      borderColor: theme.colors.textLight,
    },
    doneButton: {
      margin: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.m,
      alignItems: 'center',
    },
    doneButtonText: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textLight,
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
        <View style={styles.modal}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Languages</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Select multiple languages to see names from all of them</Text>

            <ScrollView style={styles.list}>
              {LANGUAGES.map((language) => {
                const active = isSelected(language);
                return (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageItem,
                      active && styles.languageItemActive
                    ]}
                    onPress={() => handleToggle(language)}
                  >
                    <Text style={[
                      styles.languageText,
                      active && styles.languageTextActive
                    ]}>
                      {language}
                    </Text>
                    <View style={[styles.checkbox, active && styles.checkboxActive]}>
                      {active && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};
