
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LogoText } from '../components/Logo';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Tablet breakpoint
const TABLET_MIN_WIDTH = 600;

// Futuristic Glass Card Component - works on both platforms
const GlassCard = ({
  children,
  style,
  intensity = 50,
}: {
  children: React.ReactNode;
  style?: any;
  intensity?: number;
}) => {
  if (Platform.OS === 'ios') {
    return (
      <View style={[glassStyles.glassOuter, style]}>
        <BlurView
          intensity={20}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View style={[glassStyles.glassInnerOverlay, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
          {children}
        </View>
      </View>
    );
  }

  // Android - simple semi-transparent background without blur
  return (
    <View style={[glassStyles.glassOuter, glassStyles.glassOuterAndroid, style]}>
      {children}
    </View>
  );
};

// Shared styles for glass effect
const glassStyles = StyleSheet.create({
  glassOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: Platform.OS === 'ios' ? 10 : 0,
  },
  glassOuterAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  glassInnerOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const formatDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export const LandingPage = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { signUp, login } = useAuth();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;

  const [signUpModalVisible, setSignUpModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'mom' | 'dad' | 'partner'>('mom');
  const [expecting, setExpecting] = useState<'boy' | 'girl' | 'unknown'>('unknown');
  const [status, setStatus] = useState('Expecting soon');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isSignUpPressed, setIsSignUpPressed] = useState(false);
  const [isLogInPressed, setIsLogInPressed] = useState(false);

  // Forgot password state
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetCodeMode, setResetCodeMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Forgot password - forgotPassword is an action (sends email), resetPassword is a mutation
  const forgotPasswordAction = useAction(api.authActions.forgotPassword);
  const resetPasswordMutation = useMutation(api.auth.resetPassword);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordAction({ email: forgotEmail });
      setResetMessage(result.message);
      setResetCodeMode(true);
      Alert.alert('Code Sent', 'Check your email for the reset code.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please enter reset code and new password');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPasswordMutation({
        email: forgotEmail,
        resetCode: resetCode,
        newPassword: newPassword,
      });
      Alert.alert('Success', 'Password reset successfully. Please log in.');
      // Reset state and go back to login
      setForgotPasswordMode(false);
      setResetCodeMode(false);
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');
      setResetMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageStyles = React.useMemo(() => StyleSheet.create({
    background: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    darkOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: isTablet ? 80 : 60,
    },
    content: {
      alignItems: 'center',
      width: '100%',
      maxWidth: isTablet ? 480 : undefined,
    },
    glassContainer: {
      width: '100%',
      marginBottom: 32,
    },
    glassInner: {
      padding: isTablet ? 40 : 32,
      alignItems: 'center',
    },
    title: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: isTablet ? 48 : 42,
      color: '#FFFFFF',
      marginBottom: 12,
      letterSpacing: 1,
      ...(Platform.OS === 'ios' && {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }),
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: isTablet ? 19 : 17,
      color: 'rgba(255, 255, 255, 0.95)',
      textAlign: 'center',
      lineHeight: 24,
      ...(Platform.OS === 'ios' && {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }),
    },
    buttonContainer: {
      width: '100%',
      gap: 12,
    },
    primaryButton: {
      width: '100%',
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 17,
      color: '#FFFFFF',
    },
    secondaryButton: {
      width: '100%',
      borderRadius: 30,
      overflow: 'hidden',
    },
    secondaryButtonPressed: {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
    },
    secondaryButtonInner: {
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderRadius: 30,
    },
    secondaryButtonText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 17,
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalGlass: {
      maxHeight: '85%',
      width: '100%',
      maxWidth: isTablet ? 480 : undefined,
    },
    modalContent: {
      padding: 24,
    },
    scrollContent: {
      paddingBottom: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    closeButton: {
      padding: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 20,
    },
    modalTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 24,
      color: '#FFFFFF',
    },
    modalSubtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 24,
    },
    loginSubtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      marginBottom: 24,
    },
    continueButton: {
      width: '100%',
      marginBottom: 16,
    },
    switchAuthLink: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    switchAuthText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    switchAuthHighlight: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold,
    },
    label: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 8,
      marginTop: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
    },
    statusContainer: {
      flexDirection: 'column',
    },
    statusOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionText: {
      fontFamily: theme.typography.fontFamily,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    optionTextSelected: {
      color: '#FFFFFF',
      fontFamily: theme.typography.fontFamilyBold,
    },
    modalActions: {
      flexDirection: 'row',
      marginTop: 24,
    },
  }), [theme]);

  const handleCompleteOnboarding = async () => {
    if (!firstName.trim() || !surname.trim() || !email.trim() || !password.trim() || !dateOfBirth) {
      Alert.alert('Required', 'Please fill in all fields including date of birth.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: 'Connection timed out. Please check your internet connection and try again.' }), 15000)
      );

      const result = await Promise.race([
        signUp({ email, password, firstName, surname, age: dateOfBirth ? dateOfBirth.toISOString() : '', gender, expecting, status }),
        timeoutPromise,
      ]);

      setIsSubmitting(false);

      if (result.success) {
        setSignUpModalVisible(false);
        navigation.replace('App', { fromSignUp: true });
      } else {
        Alert.alert('Sign Up Failed', result.error || 'Please try again.');
      }
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert('Sign Up Failed', 'Something went wrong. Please try again.');
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: 'Connection timed out. Please check your internet connection and try again.' }), 15000)
      );

      const result = await Promise.race([
        login(loginEmail, loginPassword),
        timeoutPromise,
      ]);

      setIsSubmitting(false);

      if (result.success) {
        setLoginModalVisible(false);
        navigation.replace('App');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid email or password.');
      }
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert('Login Failed', 'Something went wrong. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={pageStyles.background}
      resizeMode="cover"
    >
      {/* Animated Scattered Name Cards */}
      <AnimatedNameCards />

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.3, 0.55, 1]}
        style={pageStyles.darkOverlay}
      />

      <View style={pageStyles.overlay}>
        <View style={pageStyles.content}>
          {/* Main Glass Card */}
          <GlassCard style={pageStyles.glassContainer} intensity={40}>
            <View style={pageStyles.glassInner}>
              <LogoText size="large" lightText={true} />
              <Text style={pageStyles.subtitle}>
                Find the perfect name for your little one, together.
              </Text>
            </View>
          </GlassCard>

          {/* Auth Buttons */}
          <View style={pageStyles.buttonContainer}>
            <TouchableOpacity
              style={pageStyles.primaryButton}
              onPress={() => setSignUpModalVisible(true)}
              onPressIn={() => setIsSignUpPressed(true)}
              onPressOut={() => setIsSignUpPressed(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[
                  isSignUpPressed ? 'hsl(316, 69%, 52%)' : theme.colors.primary,
                  isSignUpPressed ? 'hsl(316, 69%, 42%)' : 'hsl(316, 69%, 62%)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={pageStyles.primaryButtonGradient}
              >
                <Text style={pageStyles.primaryButtonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                pageStyles.secondaryButton,
                isLogInPressed && pageStyles.secondaryButtonPressed
              ]}
              onPress={() => setLoginModalVisible(true)}
              onPressIn={() => setIsLogInPressed(true)}
              onPressOut={() => setIsLogInPressed(false)}
              activeOpacity={0.9}
            >
              <View
                style={[
                  pageStyles.secondaryButtonInner,
                  isLogInPressed && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
              >
                <Text style={pageStyles.secondaryButtonText}>Log In</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sign Up Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={signUpModalVisible}
        onRequestClose={() => setSignUpModalVisible(false)}
      >
        <View style={pageStyles.modalOverlay}>
          {Platform.OS === 'android' && (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
              experimentalBlurMethod="dimezisBlurView"
            />
          )}
          <GlassCard style={pageStyles.modalGlass} intensity={60}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={pageStyles.modalContent}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <ScrollView contentContainerStyle={pageStyles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={pageStyles.modalHeader}>
                  <Text style={pageStyles.modalTitle}>Create Account</Text>
                  <TouchableOpacity
                    onPress={() => setSignUpModalVisible(false)}
                    style={pageStyles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
                <Text style={pageStyles.modalSubtitle}>Tell us a bit about yourself.</Text>

                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Naledi"
                  textContentType="givenName"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  labelStyle={{ color: '#FFFFFF' }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                />

                <Input
                  label="Last Name"
                  value={surname}
                  onChangeText={setSurname}
                  placeholder="e.g. Ndlovu"
                  textContentType="familyName"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  labelStyle={{ color: '#FFFFFF' }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                />

                <Text style={pageStyles.label}>Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 14, marginBottom: 4 }}
                >
                  <Text style={{ color: dateOfBirth ? '#333' : '#999', fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                    {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth || new Date(1995, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    minimumDate={new Date(1940, 0, 1)}
                    onChange={(event, selected) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (selected) setDateOfBirth(selected);
                    }}
                    textColor="#FFFFFF"
                    themeVariant="dark"
                  />
                )}
                {showDatePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold, fontSize: 15 }}>Done</Text>
                  </TouchableOpacity>
                )}

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="naledi@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="email"
                  labelStyle={{ color: '#FFFFFF' }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                />

                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 characters"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  labelStyle={{ color: '#FFFFFF' }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                />

                <Text style={pageStyles.label}>I am a...</Text>
                <View style={pageStyles.row}>
                  {(['mom', 'dad', 'partner'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[pageStyles.option, gender === g && pageStyles.optionSelected]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[pageStyles.optionText, gender === g && pageStyles.optionTextSelected]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={pageStyles.label}>What are you expecting?</Text>
                <View style={pageStyles.row}>
                  {(['boy', 'girl', 'unknown'] as const).map((e) => {
                    const iconName = e === 'boy' ? 'male' : e === 'girl' ? 'female' : 'help';
                    const iconColor = expecting === e
                      ? '#FFFFFF'
                      : e === 'boy'
                        ? theme.colors.boyBlue
                        : e === 'girl'
                          ? theme.colors.girlPink
                          : theme.colors.neutralBeige;
                    return (
                      <TouchableOpacity
                        key={e}
                        style={[pageStyles.option, expecting === e && pageStyles.optionSelected]}
                        onPress={() => setExpecting(e)}
                      >
                        <Ionicons name={iconName as any} size={28} color={iconColor} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={pageStyles.label}>Status</Text>
                <View style={pageStyles.statusContainer}>
                  {['Expecting soon', 'Planning ahead'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[pageStyles.statusOption, status === s && pageStyles.optionSelected]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[pageStyles.optionText, status === s && pageStyles.optionTextSelected]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {status === 'Expecting soon' && (
                  <>
                    <Text style={pageStyles.label}>When are you expecting?</Text>
                    <TouchableOpacity
                      onPress={() => setShowDueDatePicker(true)}
                      style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 14, marginBottom: 4 }}
                    >
                      <Text style={{ color: dueDate ? '#333' : '#999', fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                        {dueDate ? formatDate(dueDate) : 'Select your due date'}
                      </Text>
                    </TouchableOpacity>
                    {showDueDatePicker && (
                      <DateTimePicker
                        value={dueDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        maximumDate={new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000)}
                        onChange={(event, selected) => {
                          if (Platform.OS === 'android') setShowDueDatePicker(false);
                          if (selected) setDueDate(selected);
                        }}
                        textColor="#FFFFFF"
                        themeVariant="dark"
                      />
                    )}
                    {showDueDatePicker && Platform.OS === 'ios' && (
                      <TouchableOpacity onPress={() => setShowDueDatePicker(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                        <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold, fontSize: 15 }}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <View style={pageStyles.modalActions}>
                  <Button
                    title="Go Back"
                    variant="ghost"
                    onPress={() => setSignUpModalVisible(false)}
                    style={{ flex: 1, marginRight: 8 }}
                    disabled={isSubmitting}
                  />
                  <Button
                    title={isSubmitting ? "Creating..." : "Sign Up"}
                    onPress={handleCompleteOnboarding}
                    style={{ flex: 1 }}
                    disabled={isSubmitting}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </GlassCard>
        </View>
      </Modal>

      {/* Login Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={loginModalVisible}
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <View style={pageStyles.modalOverlay}>
          {Platform.OS === 'android' && (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
              experimentalBlurMethod="dimezisBlurView"
            />
          )}
          <GlassCard style={pageStyles.modalGlass} intensity={60}>
            <View style={pageStyles.modalContent}>
              {!forgotPasswordMode ? (
                <>
                  <View style={pageStyles.modalHeader}>
                    <Text style={pageStyles.modalTitle}>Welcome Back!</Text>
                    <TouchableOpacity
                      onPress={() => setLoginModalVisible(false)}
                      style={pageStyles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginBottom: 24 }} />

                  <Text style={pageStyles.loginSubtitle}>
                    Enter your credentials to continue
                  </Text>

                  <Input
                    label="Email"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    placeholder="naledi@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    autoComplete="email"
                    labelStyle={{ color: '#FFFFFF' }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                  />

                  <Input
                    label="Password"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    textContentType="password"
                    autoComplete="password"
                    labelStyle={{ color: '#FFFFFF' }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                  />

                  <Button
                    title={isSubmitting ? "Logging in..." : "Log In"}
                    onPress={handleLogin}
                    style={pageStyles.continueButton}
                    disabled={isSubmitting}
                  />

                  <TouchableOpacity
                    style={pageStyles.switchAuthLink}
                    onPress={() => setForgotPasswordMode(true)}
                  >
                    <Text style={pageStyles.switchAuthText}>
                      <Text style={pageStyles.switchAuthHighlight}>Forgot Password?</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={pageStyles.switchAuthLink}
                    onPress={() => {
                      setLoginModalVisible(false);
                      setSignUpModalVisible(true);
                    }}
                  >
                    <Text style={pageStyles.switchAuthText}>
                      Don't have an account? <Text style={pageStyles.switchAuthHighlight}>Sign Up</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : !resetCodeMode ? (
                <>
                  <View style={pageStyles.modalHeader}>
                    <Text style={pageStyles.modalTitle}>Reset Password</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setForgotPasswordMode(false);
                        setForgotEmail('');
                        setResetMessage('');
                      }}
                      style={pageStyles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginBottom: 24 }} />

                  <Text style={pageStyles.loginSubtitle}>
                    Enter your email to receive a reset code
                  </Text>

                  <Input
                    label="Email"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    placeholder="naledi@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    autoComplete="email"
                    labelStyle={{ color: '#FFFFFF' }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                  />

                  <Button
                    title={isSubmitting ? "Sending..." : "Send Reset Code"}
                    onPress={handleForgotPassword}
                    style={pageStyles.continueButton}
                    disabled={isSubmitting}
                  />

                  <TouchableOpacity
                    style={pageStyles.switchAuthLink}
                    onPress={() => setForgotPasswordMode(false)}
                  >
                    <Text style={pageStyles.switchAuthText}>
                      <Text style={pageStyles.switchAuthHighlight}>Go Back</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={pageStyles.modalHeader}>
                    <Text style={pageStyles.modalTitle}>Enter Reset Code</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setForgotPasswordMode(false);
                        setResetCodeMode(false);
                        setForgotEmail('');
                        setResetCode('');
                        setNewPassword('');
                        setResetMessage('');
                      }}
                      style={pageStyles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginBottom: 24 }} />

                  <Text style={pageStyles.loginSubtitle}>
                    Enter the code sent to your email and your new password
                  </Text>

                  <Input
                    label="Reset Code"
                    value={resetCode}
                    onChangeText={setResetCode}
                    placeholder="Enter reset code"
                    autoCapitalize="characters"
                    labelStyle={{ color: '#FFFFFF' }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                  />

                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimum 8 characters"
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="new-password"
                    labelStyle={{ color: '#FFFFFF' }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#333' }}
                  />

                  <Button
                    title={isSubmitting ? "Resetting..." : "Reset Password"}
                    onPress={handleResetPassword}
                    style={pageStyles.continueButton}
                    disabled={isSubmitting}
                  />

                  <TouchableOpacity
                    style={pageStyles.switchAuthLink}
                    onPress={() => {
                      setResetCodeMode(false);
                      setResetCode('');
                      setNewPassword('');
                    }}
                  >
                    <Text style={pageStyles.switchAuthText}>
                      <Text style={pageStyles.switchAuthHighlight}>Go Back</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </ImageBackground>
  );
};

// Animated floating name card
const AnimatedCard = ({
  name,
  initialX,
  initialY,
  delay,
}: {
  name: string;
  initialX: number;
  initialY: number;
  delay: number;
}) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const rotation = useSharedValue(Math.random() * 20 - 10);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Random floating animation
    const animateCard = () => {
      const randomX = initialX + (Math.random() * 60 - 30);
      const randomY = initialY + (Math.random() * 40 - 20);
      const randomRotation = Math.random() * 24 - 12;

      translateX.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(randomX, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(initialX, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );

      translateY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(randomY, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
            withSpring(initialY, { damping: 8, stiffness: 80 })
          ),
          -1,
          true
        )
      );

      rotation.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(randomRotation, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            withTiming(-randomRotation, { duration: 3000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );

      // Subtle bounce/pulse effect
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withSpring(1, { damping: 10, stiffness: 100 })
          ),
          -1,
          true
        )
      );
    };

    animateCard();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const cardStyle = [
    scatteredGlassStyles.cardOuter,
    Platform.OS === 'android' && scatteredGlassStyles.cardOuterAndroid,
  ];

  if (Platform.OS === 'ios') {
    return (
      <Animated.View style={[cardStyle, animatedStyle]}>
        <BlurView
          intensity={18}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View style={[scatteredGlassStyles.cardInnerOverlay, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
          <View style={scatteredGlassStyles.cardContent}>
            <Text style={scatteredGlassStyles.cardText}>{name}</Text>
            <Ionicons name="heart" size={14} color="rgba(255, 255, 255, 0.9)" />
          </View>
        </View>
      </Animated.View>
    );
  }

  // Android
  return (
    <Animated.View style={[cardStyle, animatedStyle]}>
      <View style={scatteredGlassStyles.cardContent}>
        <Text style={scatteredGlassStyles.cardText}>{name}</Text>
        <Ionicons name="heart" size={14} color="rgba(255, 255, 255, 0.9)" />
      </View>
    </Animated.View>
  );
};

// Container for all animated name cards
const AnimatedNameCards = () => {
  const { width: w, height: h } = useWindowDimensions();
  const isWide = w >= TABLET_MIN_WIDTH;

  const cards = isWide
    ? [
        { name: 'Oliver', x: w * 0.1, y: h * 0.06, delay: 0 },       // English
        { name: 'Annelie', x: w * 0.55, y: h * 0.08, delay: 200 },   // Afrikaans
        { name: 'Sipho', x: w * 0.3, y: h * 0.18, delay: 400 },      // isiZulu
        { name: 'Lerato', x: w * 0.05, y: h * 0.28, delay: 600 },    // Sepedi
        { name: 'Lufuno', x: w * 0.6, y: h * 0.25, delay: 800 },     // Tshivenda
        { name: 'Riaan', x: w * 0.75, y: h * 0.12, delay: 300 },     // Afrikaans
        { name: 'Lindiwe', x: w * 0.45, y: h * 0.35, delay: 500 },   // isiZulu
        { name: 'Kabelo', x: w * 0.8, y: h * 0.32, delay: 700 },     // Sepedi
      ]
    : [
        { name: 'Oliver', x: w * 0.15, y: h * 0.08, delay: 0 },      // English
        { name: 'Annelie', x: w * 0.6, y: h * 0.10, delay: 200 },    // Afrikaans
        { name: 'Sipho', x: w * 0.35, y: h * 0.20, delay: 400 },     // isiZulu
        { name: 'Lerato', x: w * 0.08, y: h * 0.28, delay: 600 },    // Sepedi
        { name: 'Lufuno', x: w * 0.65, y: h * 0.30, delay: 800 },    // Tshivenda
      ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {cards.map((card) => (
        <AnimatedCard
          key={card.name}
          name={card.name}
          initialX={card.x}
          initialY={card.y}
          delay={card.delay}
        />
      ))}
    </View>
  );
};

// Styles for scattered glass cards
const scatteredGlassStyles = StyleSheet.create({
  cardOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: Platform.OS === 'ios' ? 6 : 0,
  },
  cardOuterAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardInnerOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    ...(Platform.OS === 'ios' && {
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }),
  },
});
