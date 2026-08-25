import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share, Pressable, Linking, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AnalyticsEvent, logEvent } from '../utils/analytics';

interface PartnerInviteDialogProps {
  visible: boolean;
  onClose: () => void;
  surname: string;
}

export const PartnerInviteDialog: React.FC<PartnerInviteDialogProps> = ({ visible, onClose, surname }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const inviteCode = user?.inviteCode || `${surname.toUpperCase().substring(0, 6)}-CODE`;
  const siteUrl = (process.env.EXPO_PUBLIC_CONVEX_URL || 'https://silent-ermine-169.convex.cloud').replace('.cloud', '.site');
  const inviteLink = `${siteUrl}/join/${inviteCode}`;

  const handleQRTap = () => {
    Alert.alert(
      'Share QR Code',
      'Your partner can scan this QR code to join you on BumpMatch. If they don\'t have the app yet, it will take them to the download page.'
    );
  };

  const inviteMessage = `Hey! I'm using BumpMatch to find the perfect baby name. Want to swipe together?\n\nJoin the ${surname} family name hunt:\nCode: ${inviteCode}\n\n${inviteLink}`;

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: inviteMessage,
        url: inviteLink,
      });
      if (result.action === Share.sharedAction) {
        logEvent(AnalyticsEvent.INVITE_SENT, {
          source: 'invite_dialog',
          channel: result.activityType ?? 'unknown',
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleWhatsAppShare = async () => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(inviteMessage)}`;
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      logEvent(AnalyticsEvent.INVITE_SENT, {
        source: 'invite_dialog',
        channel: 'whatsapp',
      });
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to wa.me web link
        await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`);
      }
    } catch (error) {
      Alert.alert('WhatsApp not available', 'Could not open WhatsApp. Try the share button instead.');
    }
  };

  const handleViewMore = () => {
    onClose();
    navigation.navigate('Partner');
  };

  const styles = React.useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.l,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(74, 68, 89, 0.45)',
    },
    dialog: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.l,
      alignItems: 'center',
      zIndex: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 4,
    },
    closeButton: {
      position: 'absolute',
      top: theme.spacing.m,
      right: theme.spacing.m,
      zIndex: 1,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.l,
    },
    title: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h3,
      color: theme.colors.text,
      marginTop: theme.spacing.s,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    qrContainer: {
      padding: theme.spacing.m,
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 3,
      marginBottom: theme.spacing.l,
    },
    codeBox: {
      backgroundColor: isDark ? theme.colors.background : theme.brand.pinkSoft,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      width: '100%',
      alignItems: 'center',
      marginBottom: theme.spacing.l,
    },
    codeLabel: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
      marginBottom: 4,
    },
    code: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.h3,
      color: isDark ? theme.colors.text : theme.brand.pinkDeep,
      letterSpacing: 2,
    },
    shareButton: {
      width: '100%',
      marginBottom: theme.spacing.s,
    },
    shareRow: {
      flexDirection: 'row',
      width: '100%',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    whatsappButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#25D366',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.m,
      flex: 1,
    },
    whatsappText: {
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: 14,
      marginLeft: 6,
    },
    viewMoreLink: {
      paddingVertical: theme.spacing.s,
    },
    viewMoreText: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: theme.typography.sizes.small,
      color: isDark ? theme.colors.primary : theme.brand.pinkDeep,
    },
  }), [theme, isDark]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.grey} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="people" size={32} color={theme.colors.primary} />
            <Text style={styles.title}>Add a Partner</Text>
            <Text style={styles.subtitle}>Share this code to sync your likes</Text>
          </View>

          <TouchableOpacity style={styles.qrContainer} onPress={handleQRTap} activeOpacity={0.7}>
            <QRCode value={inviteLink} size={150} />
          </TouchableOpacity>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your Invite Code:</Text>
            <Text style={styles.code}>{inviteCode}</Text>
          </View>

          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppShare}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
          <Button
            title="Share Invite Link"
            onPress={handleShare}
            style={styles.shareButton}
          />

          <TouchableOpacity style={styles.viewMoreLink} onPress={handleViewMore}>
            <Text style={styles.viewMoreText}>Join with partner's code instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
