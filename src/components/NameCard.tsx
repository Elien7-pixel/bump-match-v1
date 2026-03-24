import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BabyName } from '../models/BabyName';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NameCardProps {
  data: BabyName;
}

export const NameCard: React.FC<NameCardProps> = ({ data }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const surname = user?.surname || '';
  const { width } = useWindowDimensions();
  const CARD_WIDTH = Math.min(width * 0.82, 400);
  const CARD_HEIGHT = CARD_WIDTH * 1.3;

  const getGradientColors = () => {
    if (data.gender === 'boy') return [theme.colors.boyBlue, '#3B82F6'] as const;
    if (data.gender === 'girl') return [theme.colors.girlPink, '#EC4899'] as const;
    // Neutral beige/yellow gradient for unisex
    return [theme.colors.neutralBeige, '#E8C547'] as const;
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: theme.borderRadius.xl,
      shadowColor: theme.colors.shadow,
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
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.l,
      justifyContent: 'space-around',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.m,
    },
    name: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 48,
      color: theme.colors.textLight,
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
      marginBottom: theme.spacing.s,
    },
    surname: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 48,
      color: theme.colors.textLight,
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
      marginBottom: theme.spacing.s,
    },
    details: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.h3,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: theme.spacing.xl,
    },
    infoBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      width: '100%',
      alignItems: 'center',
    },
    meaningTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.small,
      color: 'rgba(255, 255, 255, 0.8)',
      textTransform: 'uppercase',
    },
    meaning: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.h3,
      color: theme.colors.textLight,
      textAlign: 'center',
      marginBottom: theme.spacing.m,
    },
    spacer: {
      height: theme.spacing.s,
    },
    originTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.small,
      color: 'rgba(255, 255, 255, 0.8)',
      textTransform: 'uppercase',
    },
    origin: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textLight,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    hint: {
      color: 'rgba(255,255,255, 0.6)',
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 12,
    },
    infoButton: {
      position: 'absolute',
      top: theme.spacing.m,
      right: theme.spacing.m,
      zIndex: 10,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    }
  }), [theme]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {data.celebrity ? (
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => Alert.alert(data.name, `Named by ${data.celebrity}\n\nMeaning: ${data.meaning}\nOrigin: ${data.origin}`)}
          >
            <Ionicons name="information-circle" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{data.name}</Text>
          {surname ? (
            <Text style={styles.surname}>{surname}</Text>
          ) : null}
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
