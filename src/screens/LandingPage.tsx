
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
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
import { Brand } from '../theme/designTokens';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';
import { cleanErrorMessage } from '../utils/errors';

// Tablet breakpoint
const TABLET_MIN_WIDTH = 600;

// Solid white brand card (formerly a dark glass panel) - works on both platforms
const GlassCard = ({
  children,
  style,
  intensity = 50,
}: {
  children: React.ReactNode;
  style?: any;
  intensity?: number;
}) => {
  return (
    <View style={[glassStyles.glassOuter, style]}>
      <View style={glassStyles.glassInnerOverlay}>
        {children}
      </View>
    </View>
  );
};

// Shared styles for the white brand card
const glassStyles = StyleSheet.create({
  glassOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E9E1',                    // theme.colors.border
    backgroundColor: '#FFFFFF',                // theme.colors.card
    shadowColor: 'rgba(140, 127, 201, 0.18)',  // theme.colors.shadow (soft purple)
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  glassInnerOverlay: {
    backgroundColor: 'transparent',
  },
});


// Date picker presented in its own bottom sheet on iOS so the inline spinner
// never clips or steals scroll gestures inside the constrained sign-up modal.
// On Android the native dialog is triggered by mounting the picker directly.
const DatePickerSheet = ({
  visible,
  value,
  title,
  minimumDate,
  maximumDate,
  primaryColor,
  fontFamily,
  fontFamilyBold,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: Date;
  title: string;
  minimumDate?: Date;
  maximumDate?: Date;
  primaryColor: string;
  fontFamily?: string;
  fontFamilyBold?: string;
  onChange: (d: Date) => void;
  onClose: () => void;
}) => {
  if (!visible) return null;

  if (Platform.OS !== 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(_event, selected) => {
          onClose();
          if (selected) onChange(selected);
        }}
      />
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.sheetHeader}>
          <Text style={[sheetStyles.sheetTitle, { fontFamily }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[sheetStyles.doneText, { color: primaryColor, fontFamily: fontFamilyBold }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={value}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_event, selected) => {
            if (selected) onChange(selected);
          }}
          themeVariant="light"
        />
      </View>
    </Modal>
  );
};

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 68, 89, 0.45)',   // ink-based scrim
  },
  sheet: {
    backgroundColor: '#FFFFFF',                  // theme.colors.card
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetTitle: {
    fontSize: 16,
    color: Brand.ink,
  },
  doneText: {
    fontSize: 16,
  },
});

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
      Alert.alert('Error', cleanErrorMessage(error, 'Could not send the reset email. Please try again.'));
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
      Alert.alert('Error', cleanErrorMessage(error, 'Could not reset your password. Please check your code and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Layout metrics for the splash composition (purple sky, cream wave base)
  const squircleSize = Math.min(width * (isTablet ? 0.3 : 0.44), 230);
  const rainbowWidth = Math.min(width * 0.58, 300);
  const rainbowHeight = rainbowWidth / 1.7;   // rainbow.png aspect ratio
  const WAVE_HEIGHT = 70;

  const pageStyles = React.useMemo(() => StyleSheet.create({
    background: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: theme.brand.purple,
    },
    heroWrap: {
      position: 'absolute',
      top: height * (isTablet ? 0.15 : 0.175),
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    logoSquircle: {
      width: squircleSize,
      height: squircleSize,
      borderRadius: squircleSize * 0.24,
      backgroundColor: theme.brand.cream,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'rgba(74, 68, 89, 0.3)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 6,
    },
    logoMark: {
      width: squircleSize * 0.52,
      height: squircleSize * 0.7,
    },
    starSmallRight: {
      position: 'absolute',
      right: width * 0.09,
      top: height * 0.3,
      width: 40,
      height: 40,
      transform: [{ rotate: '12deg' }],
      pointerEvents: 'none',
    },
    starSmallLeft: {
      position: 'absolute',
      left: width * 0.07,
      top: height * 0.54,
      width: 34,
      height: 34,
      transform: [{ rotate: '-14deg' }],
      pointerEvents: 'none',
    },
    bottomSection: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    rainbow: {
      position: 'absolute',
      alignSelf: 'center',
      top: -rainbowHeight * 0.42,
      width: rainbowWidth,
      height: rainbowHeight,
    },
    waveStar: {
      position: 'absolute',
      right: 10,
      top: -26,
      width: 58,
      height: 58,
      transform: [{ rotate: '-12deg' }],
    },
    bottomContent: {
      backgroundColor: theme.brand.cream,
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: isTablet ? 64 : 44,
      marginTop: -1,
    },
    heroWordmark: {
      marginBottom: 24,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: isTablet ? 480 : undefined,
      gap: 12,
    },
    primaryButton: {
      width: '100%',
      borderRadius: theme.borderRadius.m,
      overflow: 'hidden',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    primaryButtonGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: 17,
      color: theme.colors.textLight,
    },
    secondaryButton: {
      width: '100%',
      borderRadius: theme.borderRadius.m,
      overflow: 'hidden',
    },
    secondaryButtonPressed: {
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    secondaryButtonInner: {
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: theme.brand.pinkSoft,
      borderRadius: theme.borderRadius.m,
    },
    secondaryButtonText: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: 17,
      color: Brand.ink,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(74, 68, 89, 0.45)',
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
      backgroundColor: theme.brand.pinkSoft,
      borderRadius: 20,
    },
    modalTitle: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: 24,
      color: theme.colors.text,
    },
    modalSubtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 16,
      color: theme.colors.textDim,
      marginBottom: 24,
    },
    loginSubtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 16,
      color: theme.colors.textDim,
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
      color: theme.colors.textDim,
    },
    switchAuthHighlight: {
      color: theme.brand.pinkDeep,
      fontFamily: theme.typography.fontFamilyBold,
    },
    label: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 13,
      color: theme.colors.text,
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
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
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
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      marginBottom: 8,
    },
    optionSelected: {
      backgroundColor: theme.brand.pinkSoft,
      borderColor: theme.colors.primary,
    },
    optionSelectedBoy: {
      backgroundColor: theme.brand.tealSoft,
      borderColor: theme.brand.tealDeep,
    },
    optionSelectedGirl: {
      backgroundColor: theme.brand.pinkSoft,
      borderColor: theme.brand.pinkDeep,
    },
    optionSelectedNeutral: {
      backgroundColor: theme.brand.yellowSoft,
      borderColor: theme.brand.yellowDeep,
    },
    optionText: {
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
    },
    optionTextSelected: {
      color: theme.brand.pinkDeep,
      fontFamily: theme.typography.fontFamilySemiBold,
    },
    modalActions: {
      flexDirection: 'row',
      marginTop: 24,
    },
  }), [theme, width, height, isTablet, squircleSize, rainbowWidth, rainbowHeight]);

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
    <View style={pageStyles.background}>
      {/* Animated name pills floating in the purple sky */}
      <AnimatedNameCards />

      {/* Scattered yellow stars on the purple */}
      <Image
        source={require('../../assets/brand/icons/star-2.png')}
        style={pageStyles.starSmallRight}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/brand/icons/star-2.png')}
        style={pageStyles.starSmallLeft}
        resizeMode="contain"
      />

      {/* Cream squircle holding the mother-and-baby mark */}
      <View style={pageStyles.heroWrap} pointerEvents="none">
        <View style={pageStyles.logoSquircle}>
          <Image
            source={require('../../assets/brand/logo-mark-purple.png')}
            style={pageStyles.logoMark}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Cream wave base — rainbow peeks out from behind the wave crest */}
      <View style={pageStyles.bottomSection}>
        <Image
          source={require('../../assets/brand/icons/rainbow.png')}
          style={pageStyles.rainbow}
          resizeMode="contain"
        />
        <Svg width="100%" height={WAVE_HEIGHT} viewBox="0 0 100 28" preserveAspectRatio="none">
          <Path
            d="M0 14 C 16 4 30 3 48 11 C 62 17 76 19 100 9 L 100 28 L 0 28 Z"
            fill={theme.brand.cream}
          />
        </Svg>
        <Image
          source={require('../../assets/brand/icons/star-2.png')}
          style={pageStyles.waveStar}
          resizeMode="contain"
        />

        <View style={pageStyles.bottomContent}>
          {/* Bump Match wordmark (with tagline) just above the sign up block */}
          <LogoText size="large" lightText={false} style={pageStyles.heroWordmark} />
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
                  isSignUpPressed ? theme.brand.pinkDeep : theme.colors.primary,
                  isSignUpPressed ? theme.brand.pinkDeep : theme.colors.primary
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
                  isLogInPressed && { backgroundColor: theme.brand.pink }
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
              tint="light"
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
                    <Ionicons name="close" size={24} color={theme.colors.text} />
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
                  labelStyle={{ color: theme.colors.text }}
                  style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
                />

                <Input
                  label="Last Name"
                  value={surname}
                  onChangeText={setSurname}
                  placeholder="e.g. Ndlovu"
                  textContentType="familyName"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  labelStyle={{ color: theme.colors.text }}
                  style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
                />

                <Text style={pageStyles.label}>Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.m, padding: 14, marginBottom: 4 }}
                >
                  <Text style={{ color: dateOfBirth ? theme.colors.text : theme.colors.grey, fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                    {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
                  </Text>
                </TouchableOpacity>
                <DatePickerSheet
                  visible={showDatePicker}
                  value={dateOfBirth || new Date(1995, 0, 1)}
                  title="Date of Birth"
                  maximumDate={new Date()}
                  minimumDate={new Date(1940, 0, 1)}
                  primaryColor={theme.brand.pinkDeep}
                  fontFamily={theme.typography.fontFamily}
                  fontFamilyBold={theme.typography.fontFamilyBold}
                  onChange={setDateOfBirth}
                  onClose={() => setShowDatePicker(false)}
                />

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="naledi@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="email"
                  labelStyle={{ color: theme.colors.text }}
                  style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
                />

                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 characters"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  labelStyle={{ color: theme.colors.text }}
                  style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
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
                      ? (e === 'boy'
                          ? theme.brand.tealDeep
                          : e === 'girl'
                            ? theme.brand.pinkDeep
                            : theme.brand.yellowDeep)
                      : e === 'boy'
                        ? theme.colors.boyBlue
                        : e === 'girl'
                          ? theme.colors.girlPink
                          : theme.colors.neutralBeige;
                    const selectedStyle = e === 'boy'
                      ? pageStyles.optionSelectedBoy
                      : e === 'girl'
                        ? pageStyles.optionSelectedGirl
                        : pageStyles.optionSelectedNeutral;
                    return (
                      <TouchableOpacity
                        key={e}
                        style={[pageStyles.option, expecting === e && selectedStyle]}
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
                      style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.m, padding: 14, marginBottom: 4 }}
                    >
                      <Text style={{ color: dueDate ? theme.colors.text : theme.colors.grey, fontSize: 16, fontFamily: theme.typography.fontFamily }}>
                        {dueDate ? formatDate(dueDate) : 'Select your due date'}
                      </Text>
                    </TouchableOpacity>
                    <DatePickerSheet
                      visible={showDueDatePicker}
                      value={dueDate || new Date()}
                      title="When are you expecting?"
                      minimumDate={new Date()}
                      maximumDate={new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000)}
                      primaryColor={theme.brand.pinkDeep}
                      fontFamily={theme.typography.fontFamily}
                      fontFamilyBold={theme.typography.fontFamilyBold}
                      onChange={setDueDate}
                      onClose={() => setShowDueDatePicker(false)}
                    />
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
              tint="light"
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
                      <Ionicons name="close" size={24} color={theme.colors.text} />
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
                    labelStyle={{ color: theme.colors.text }}
                    style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
                  />

                  <Input
                    label="Password"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    textContentType="password"
                    autoComplete="password"
                    labelStyle={{ color: theme.colors.text }}
                    style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
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
                      <Ionicons name="close" size={24} color={theme.colors.text} />
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
                    labelStyle={{ color: theme.colors.text }}
                    style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
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
                      <Ionicons name="close" size={24} color={theme.colors.text} />
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
                    labelStyle={{ color: theme.colors.text }}
                    style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
                  />

                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimum 8 characters"
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="new-password"
                    labelStyle={{ color: theme.colors.text }}
                    style={{ backgroundColor: theme.colors.card, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border }}
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
    </View>
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

  const cardStyle = [scatteredGlassStyles.cardOuter];

  return (
    <Animated.View style={[cardStyle, animatedStyle]}>
      <View style={scatteredGlassStyles.cardContent}>
        <Text style={scatteredGlassStyles.cardText}>{name}</Text>
        <Ionicons name="heart" size={14} color={Brand.pink} />
      </View>
    </Animated.View>
  );
};

// Container for all animated name cards
const AnimatedNameCards = () => {
  const { width: w, height: h } = useWindowDimensions();
  const isWide = w >= TABLET_MIN_WIDTH;

  // Positioned to frame the centre logo squircle: a pair above it, the rest in
  // the open band between the logo and the cream wave — never overlapping either.
  const cards = isWide
    ? [
        { name: 'Oliver', x: w * 0.08, y: h * 0.05, delay: 0 },      // English
        { name: 'Annelie', x: w * 0.55, y: h * 0.05, delay: 200 },   // Afrikaans
        { name: 'Riaan', x: w * 0.78, y: h * 0.11, delay: 300 },     // Afrikaans
        { name: 'Lindiwe', x: w * 0.14, y: h * 0.12, delay: 500 },   // isiZulu
        { name: 'Sipho', x: w * 0.07, y: h * 0.44, delay: 400 },     // isiZulu
        { name: 'Kabelo', x: w * 0.72, y: h * 0.44, delay: 700 },    // Sepedi
        { name: 'Lerato', x: w * 0.28, y: h * 0.5, delay: 600 },     // Sepedi
        { name: 'Lufuno', x: w * 0.56, y: h * 0.52, delay: 800 },    // Tshivenda
      ]
    : [
        { name: 'Annelie', x: w * 0.1, y: h * 0.11, delay: 200 },    // Afrikaans
        { name: 'Lerato', x: w * 0.55, y: h * 0.07, delay: 0 },      // Sepedi
        { name: 'Sipho', x: w * 0.1, y: h * 0.42, delay: 400 },      // isiZulu
        { name: 'Oliver', x: w * 0.58, y: h * 0.435, delay: 600 },   // English
        { name: 'Lufuno', x: w * 0.28, y: h * 0.475, delay: 800 },   // Tshivenda
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

// Styles for scattered floating name cards
const scatteredGlassStyles = StyleSheet.create({
  cardOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E9E1',                    // theme.colors.border
    backgroundColor: '#FFFFFF',                // theme.colors.card
    shadowColor: 'rgba(140, 127, 201, 0.18)',  // theme.colors.shadow (soft purple)
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: Brand.ink,
  },
});
