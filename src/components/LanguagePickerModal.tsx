
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTokens } from '../theme/designTokens';

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
  const handleSelect = (language: string) => {
    onSelectLanguage(language);
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
        <TouchableOpacity activeOpacity={1} style={styles.modal}>
          <SafeAreaView style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Language</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={AppTokens.colors.text} />
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
                    <Ionicons name="checkmark" size={24} color={AppTokens.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  modal: {
    backgroundColor: AppTokens.colors.background,
    borderTopLeftRadius: AppTokens.borderRadius.xl,
    borderTopRightRadius: AppTokens.borderRadius.xl,
    maxHeight: '70%',
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
  list: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AppTokens.spacing.l,
    marginHorizontal: AppTokens.spacing.m,
    marginVertical: 4,
    backgroundColor: 'white',
    borderRadius: AppTokens.borderRadius.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  languageItemActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: AppTokens.colors.primary,
  },
  languageText: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.text,
  },
  languageTextActive: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    color: AppTokens.colors.primary,
  },
});
