
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BabyName } from '../models/BabyName';
import { AppTokens } from '../theme/designTokens';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface NameCardProps {
  data: BabyName;
}

export const NameCard: React.FC<NameCardProps> = ({ data }) => {
  const getGradientColors = () => {
    if (data.gender === 'boy') return [AppTokens.colors.boyBlue, '#3B82F6'] as const;
    if (data.gender === 'girl') return [AppTokens.colors.girlPink, '#EC4899'] as const;
    // Random pastel gradient for unisex
    return AppTokens.gradients.g3;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.details}>{data.gender.toUpperCase()}</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.meaningTitle}>Meaning</Text>
            <Text style={styles.meaning}>{data.meaning}</Text>
            <View style={styles.spacer} />
            <Text style={styles.originTitle}>Origin</Text>
            <Text style={styles.origin}>{data.origin}</Text>
          </View>
        </View>

        <View style={styles.footer}>
            <Text style={styles.hint}>← Dislike</Text>
            <Text style={styles.hint}>Like →</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: AppTokens.borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  card: {
    flex: 1,
    borderRadius: AppTokens.borderRadius.xl,
    padding: AppTokens.spacing.l,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: 48,
    color: AppTokens.colors.textLight,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginBottom: AppTokens.spacing.s,
  },
  details: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.h3,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: AppTokens.spacing.xl,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: AppTokens.borderRadius.l,
    padding: AppTokens.spacing.l,
    width: '100%',
    alignItems: 'center',
  },
  meaningTitle: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.small,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  meaning: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h3,
    color: AppTokens.colors.textLight,
    textAlign: 'center',
    marginBottom: AppTokens.spacing.m,
  },
  spacer: {
    height: AppTokens.spacing.s,
  },
  originTitle: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.small,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  origin: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: AppTokens.spacing.m,
  },
  hint: {
      color: 'rgba(255,255,255, 0.6)',
      fontFamily: AppTokens.typography.fontFamilyBold,
      fontSize: 12
  }
});
