
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppTokens } from '../theme/designTokens';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

interface PartnerInviteDialogProps {
  visible: boolean;
  onClose: () => void;
  surname: string;
}

export const PartnerInviteDialog: React.FC<PartnerInviteDialogProps> = ({ visible, onClose, surname }) => {
  const inviteLink = `https://bumpmatch.app/join/${surname}`; // Mock link

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on BumpMatch to find a name for Baby ${surname}! ${inviteLink}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
             <Ionicons name="close" size={24} color={AppTokens.colors.grey} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="people" size={32} color={AppTokens.colors.primary} />
            <Text style={styles.title}>Add a Partner</Text>
          </View>

          <View style={styles.qrContainer}>
            <QRCode value={inviteLink} size={150} />
          </View>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Invite Code:</Text>
            <Text style={styles.code}>{surname.toUpperCase()}-1234</Text>
          </View>
          
          <Button 
            title="Share Invite Link" 
            onPress={handleShare}
            style={styles.shareButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: AppTokens.spacing.l,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: AppTokens.borderRadius.l,
    padding: AppTokens.spacing.l,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: AppTokens.spacing.m,
    right: AppTokens.spacing.m,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: AppTokens.spacing.l,
  },
  title: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h3,
    color: AppTokens.colors.text,
    marginTop: AppTokens.spacing.s,
  },
  qrContainer: {
    padding: AppTokens.spacing.m,
    backgroundColor: 'white',
    borderRadius: AppTokens.borderRadius.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: AppTokens.spacing.l,
  },
  codeBox: {
    backgroundColor: '#F3F4F6',
    padding: AppTokens.spacing.m,
    borderRadius: AppTokens.borderRadius.m,
    width: '100%',
    alignItems: 'center',
    marginBottom: AppTokens.spacing.l,
  },
  codeLabel: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.small,
    color: AppTokens.colors.grey,
    marginBottom: 4,
  },
  code: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h3,
    color: AppTokens.colors.text,
    letterSpacing: 2,
  },
  shareButton: {
    width: '100%',
  }
});
