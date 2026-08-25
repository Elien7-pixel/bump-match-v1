import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { setTrackingConsent } from '../utils/analytics';

/**
 * Android's equivalent of Apple's App Tracking Transparency prompt.
 *
 * iOS gets a consent gate from the OS; Android has none, so without this the
 * same advertising processing would have a lawful basis on one platform and
 * nothing on the other. Declining is a first-class choice — the app is
 * identical either way, and that is stated plainly rather than buried.
 *
 * Shown once. The answer is changeable afterwards in Settings.
 */
interface TrackingConsentDialogProps {
  visible: boolean;
  onDone: () => void;
}

export const TrackingConsentDialog: React.FC<TrackingConsentDialogProps> = ({ visible, onDone }) => {
  const { theme } = useTheme();

  const answer = async (granted: boolean) => {
    await setTrackingConsent(granted);
    onDone();
  };

  const styles = React.useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 24,
    },
    iconWrap: {
      alignSelf: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.brand.pinkSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 19,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    body: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.grey,
      textAlign: 'center',
      marginBottom: 14,
    },
    reassure: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.text,
      backgroundColor: theme.brand.tealSoft,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
    },
    primary: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.round,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 10,
    },
    primaryText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 15,
      color: theme.colors.textLight,
    },
    secondary: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      color: theme.colors.grey,
    },
  }), [theme]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => answer(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="heart-outline" size={28} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Help us reach more parents-to-be</Text>

          <Text style={styles.body}>
            We advertise Bump Match on Facebook and Instagram. Allowing this lets us see which
            ads actually bring people to the app, and show ads to people like you.
          </Text>

          <Text style={styles.reassure}>
            We never share your pregnancy details, due date, cultural heritage, or the names
            you swipe on. Not with anyone. The app works exactly the same either way.
          </Text>

          <TouchableOpacity style={styles.primary} onPress={() => answer(true)} accessibilityRole="button">
            <Text style={styles.primaryText}>Allow</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondary} onPress={() => answer(false)} accessibilityRole="button">
            <Text style={styles.secondaryText}>No thanks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
