
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Input } from './Input';

const GENDER_OPTIONS = ['boy', 'girl', 'unisex'] as const;
type GenderOption = typeof GENDER_OPTIONS[number];

const LANGUAGES = [
  'English',
  'Afrikaans',
  'isiZulu',
  'isiXhosa',
  'Sesotho',
  'Setswana',
  'Sepedi',
  'Tshivenda',
  'Xitsonga',
  'siSwati',
  'isiNdebele',
  'Greek',
  'Latin',
  'French',
  'Italian',
  'Spanish',
  'Portuguese',
  'German',
];

interface SubmitNameModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SubmitNameModal: React.FC<SubmitNameModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderOption>('boy');
  const [origin, setOrigin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [language, setLanguage] = useState('English');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitNameMutation = useMutation(api.submissions.submitName);

  const resetForm = () => {
    setName('');
    setGender('boy');
    setOrigin('');
    setMeaning('');
    setLanguage('English');
    setShowLanguagePicker(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }

    if (!token) {
      Alert.alert('Not Signed In', 'Please sign in to suggest a name.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitNameMutation({
        token,
        name: name.trim(),
        gender,
        origin: origin.trim() || 'Unknown',
        meaning: meaning.trim() || 'User submitted',
        language,
      });

      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      maxHeight: '85%',
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
    content: {
      padding: theme.spacing.l,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.grey,
      marginBottom: theme.spacing.l,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 13,
      color: theme.colors.text,
      marginBottom: theme.spacing.s,
      marginTop: theme.spacing.m,
    },
    genderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.s,
    },
    genderOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
    },
    genderOptionSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    genderText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    genderTextSelected: {
      color: '#FFFFFF',
      fontFamily: theme.typography.fontFamilyBold,
    },
    languageSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.m,
      backgroundColor: isDark ? theme.colors.card : '#F3F4F6',
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.border : 'transparent',
      marginBottom: theme.spacing.m,
    },
    languageSelectorText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    languageList: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.m,
      maxHeight: 200,
    },
    languageItem: {
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    languageItemSelected: {
      backgroundColor: isDark ? 'rgba(200, 100, 180, 0.15)' : 'rgba(200, 100, 180, 0.08)',
    },
    languageItemText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    languageItemTextSelected: {
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.primary,
    },
    submitButton: {
      borderRadius: theme.borderRadius.l,
      overflow: 'hidden',
      marginTop: theme.spacing.l,
    },
    submitButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    submitButtonText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 17,
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.6,
    },
    // Success state
    successContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.l,
    },
    successIcon: {
      marginBottom: theme.spacing.l,
    },
    successTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.m,
    },
    successMessage: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.grey,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    doneButton: {
      borderRadius: theme.borderRadius.l,
      overflow: 'hidden',
      width: '100%',
    },
    doneButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    doneButtonText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 17,
      color: '#FFFFFF',
    },
    submitAnotherButton: {
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: theme.spacing.m,
    },
    submitAnotherText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 15,
      color: theme.colors.primary,
    },
  }), [theme, isDark]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.drawer}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.header}>
              <Text style={styles.title}>Suggest a Name</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {submitted ? (
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color="#10B981"
                  style={styles.successIcon}
                />
                <Text style={styles.successTitle}>Name Submitted!</Text>
                <Text style={styles.successMessage}>
                  Name submitted for review and added to your likes!
                </Text>

                <TouchableOpacity style={styles.doneButton} onPress={handleClose} activeOpacity={0.9}>
                  <LinearGradient
                    colors={[theme.colors.primary, 'hsl(316, 69%, 62%)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.doneButtonGradient}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitAnotherButton}
                  onPress={() => {
                    resetForm();
                  }}
                >
                  <Text style={styles.submitAnotherText}>Submit Another Name</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
              >
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.content}>
                    <Text style={styles.subtitle}>
                      Know a great baby name? Submit it for others to discover.
                    </Text>

                    <Input
                      label="Name"
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Amahle"
                      autoCapitalize="words"
                    />

                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.genderRow}>
                      {GENDER_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.genderOption,
                            gender === option && styles.genderOptionSelected,
                          ]}
                          onPress={() => setGender(option)}
                        >
                          <Text
                            style={[
                              styles.genderText,
                              gender === option && styles.genderTextSelected,
                            ]}
                          >
                            {option === 'boy' ? 'Boy' : option === 'girl' ? 'Girl' : 'Unisex'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Input
                      label="Origin"
                      value={origin}
                      onChangeText={setOrigin}
                      placeholder="e.g. Zulu, Greek, Hebrew"
                      autoCapitalize="words"
                    />

                    <Input
                      label="Meaning"
                      value={meaning}
                      onChangeText={setMeaning}
                      placeholder="e.g. Beautiful one"
                      autoCapitalize="sentences"
                    />

                    <TouchableOpacity
                      style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[theme.colors.primary, 'hsl(316, 69%, 62%)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitButtonGradient}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.submitButtonText}>Submit Name</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};
