
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (language: string) => void;
}

const LANGUAGES = [
  'All',
  'Afrikaans',
  'English',
  'isiNdebele',
  'isiXhosa',
  'isiZulu',
  'Sepedi',
  'Sesotho',
  'Setswana',
  'siSwati',
  'Tshivenda',
  'Xitsonga',
  'Greek',
  'Latin',
];

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const { theme, isDark } = useTheme();

  const handleSelect = (language: string) => {
    onSelectLanguage(language);
    onClose();
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
    modal: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '70%',
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
    list: {
      minHeight: 300,
      paddingBottom: theme.spacing.xl,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.l,
      marginHorizontal: theme.spacing.m,
      marginVertical: 4,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    languageItemActive: {
      backgroundColor: isDark ? theme.colors.primary : '#E0F2FE',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    languageText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    languageTextActive: {
      fontFamily: theme.typography.fontFamilyBold,
      color: isDark ? 'white' : theme.colors.primary,
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
              <Text style={styles.title}>Select Language</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.languageItem,
                    currentLanguage === language && styles.languageItemActive
                  ]}
                  onPress={() => handleSelect(language)}
                >
                  <Text style={[
                    styles.languageText,
                    currentLanguage === language && styles.languageTextActive
                  ]}>
                    {language}
                  </Text>
                  {currentLanguage === language && (
                    <Ionicons name="checkmark" size={24} color={isDark ? 'white' : theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};
