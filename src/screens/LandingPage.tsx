
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTokens } from '../theme/designTokens';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useNavigation } from '@react-navigation/native';

export const LandingPage = () => {
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState<'mom' | 'dad' | 'partner'>('mom');
  const [status, setStatus] = useState('Expecting soon');

  const handleCompleteOnboarding = async () => {
    if (!surname.trim()) {
      Alert.alert('Required', 'Please enter your last name.');
      return;
    }

    const profile = {
      surname,
      gender,
      status
    };

    try {
      await AsyncStorage.setItem('bumpmatch_user_profile', JSON.stringify(profile));
      await AsyncStorage.setItem('bumpmatch_onboarding_completed', 'true');
      setModalVisible(false);
      navigation.replace('App');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  return (
    <LinearGradient
      colors={['#fbc2eb', '#a6c1ee', '#ffecd2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      
      <View style={styles.gradientOverlay}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👶</Text>
          </View>
          <Text style={styles.title}>BumpMatch</Text>
          <Text style={styles.subtitle}>Find the perfect name for your little one, together.</Text>
          
          <Button 
            title="Log In / Sign Up" 
            onPress={() => setModalVisible(true)}
            style={styles.button}
          />
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
             <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalTitle}>Welcome!</Text>
            <Text style={styles.modalSubtitle}>Tell us a bit about yourself.</Text>

            <Input 
              label="Last Name"
              value={surname}
              onChangeText={setSurname}
              placeholder="e.g. Smith"
            />

            <Text style={styles.label}>I am a...</Text>
            <View style={styles.row}>
              {['mom', 'dad', 'partner'].map((g) => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.option, gender === g && styles.optionSelected]}
                  onPress={() => setGender(g as any)}
                >
                  <Text style={[styles.optionText, gender === g && styles.optionTextSelected]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {['Expecting soon', 'Just found out', 'Have child'].map((s) => (
                <TouchableOpacity 
                  key={s}
                  style={[styles.statusOption, status === s && styles.optionSelected]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.optionText, status === s && styles.optionTextSelected]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button 
                title="Cancel" 
                variant="ghost" 
                onPress={() => setModalVisible(false)} 
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button 
                title="Start Swiping" 
                onPress={handleCompleteOnboarding} 
                style={{ flex: 1 }}
              />
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: -80,
    right: -80,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: 150,
    left: -60,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 200,
    right: -40,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: AppTokens.spacing.l,
  },
  content: {
    marginBottom: AppTokens.spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppTokens.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.hero,
    color: '#333',
    marginBottom: AppTokens.spacing.s,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.h3,
    color: '#555',
    marginBottom: AppTokens.spacing.xl,
    textAlign: 'center',
    paddingHorizontal: AppTokens.spacing.m,
  },
  button: {
    width: '100%',
    backgroundColor: AppTokens.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: AppTokens.spacing.m,
  },
  modalContent: {
    backgroundColor: AppTokens.colors.background,
    borderRadius: AppTokens.borderRadius.l,
    padding: AppTokens.spacing.l,
  },
  scrollContent: {
      paddingBottom: AppTokens.spacing.m
  },
  modalTitle: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h2,
    color: AppTokens.colors.text,
    marginBottom: AppTokens.spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.grey,
    marginBottom: AppTokens.spacing.l,
    textAlign: 'center',
  },
  label: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.small,
    color: AppTokens.colors.text,
    marginBottom: AppTokens.spacing.s,
    marginTop: AppTokens.spacing.m,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    paddingVertical: AppTokens.spacing.s,
    paddingHorizontal: AppTokens.spacing.m,
    borderRadius: AppTokens.borderRadius.m,
    borderWidth: 1,
    borderColor: AppTokens.colors.grey,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statusContainer: {
      flexDirection: 'column',
  },
  statusOption: {
    paddingVertical: AppTokens.spacing.s,
    paddingHorizontal: AppTokens.spacing.m,
    borderRadius: AppTokens.borderRadius.m,
    borderWidth: 1,
    borderColor: AppTokens.colors.grey,
    alignItems: 'center',
    marginBottom: 8
  },
  optionSelected: {
    backgroundColor: AppTokens.colors.primary,
    borderColor: AppTokens.colors.primary,
  },
  optionText: {
    fontFamily: AppTokens.typography.fontFamily,
    color: AppTokens.colors.text,
  },
  optionTextSelected: {
    color: AppTokens.colors.textLight,
    fontFamily: AppTokens.typography.fontFamilyBold,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: AppTokens.spacing.xl,
  },
});
