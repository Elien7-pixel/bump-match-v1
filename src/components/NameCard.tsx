import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { BabyName } from '../models/BabyName';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NameCardProps {
  data: BabyName;
  onFavorite?: (name: BabyName) => void;
  isFavorited?: boolean;
  // Animated background colour layer driven by swipe direction (sits between
  // the gradient and the content so the card itself appears to change colour).
  tintStyle?: any;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const NameCard: React.FC<NameCardProps> = ({ data, onFavorite, isFavorited, tintStyle }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const surname = capitalize(user?.surname || '');
  const { width, height } = useWindowDimensions();
  const CARD_WIDTH = Math.min(width * 0.80, 380);
  // Clamp to the vertical budget so short/wide Android devices never overflow
  // the stack area into the search bar or action buttons.
  const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.2, height * 0.52);

  const getGradientColors = () => {
    if (data.gender === 'boy') return [theme.colors.boyBlue, theme.brand.tealDeep] as const;
    if (data.gender === 'girl') return [theme.colors.girlPink, theme.brand.pinkDeep] as const;
    // Purple gradient for neutral / unisex
    return [theme.brand.purple, theme.brand.purpleDeep] as const;
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
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 4,
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
    // Fixed two-line box: a long "FirstName Surname" wraps (surname on its own
    // line) instead of tail-ellipsizing, and the card layout stays identical
    // whether the title uses one line or two.
    nameWrap: {
      height: 104, // 2 × lineHeight
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.s,
    },
    name: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: 44,
      color: theme.colors.textLight,
      textShadowColor: 'rgba(74, 68, 89, 0.25)',
      textShadowOffset: { width: 1, height: 2 },
      textShadowRadius: 4,
      lineHeight: 52,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.s,
      includeFontPadding: false,
    },
    details: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.h3,
      color: 'rgba(255, 255, 255, 0.9)',
      letterSpacing: 2,
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
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.small,
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 1,
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
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.small,
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 1,
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
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.round,
      overflow: 'hidden',
      includeFontPadding: false,
    },
    hintDislike: {
      color: theme.colors.swipeNo,
    },
    hintLike: {
      color: theme.colors.swipeYes,
    },
    tintFill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: theme.borderRadius.xl,
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
    },
    favoriteButton: {
      position: 'absolute',
      top: theme.spacing.m,
      left: theme.spacing.m,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(74, 68, 89, 0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {tintStyle ? (
          <Animated.View pointerEvents="none" style={[styles.tintFill, tintStyle]} />
        ) : null}
        {onFavorite ? (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onFavorite(data)}
          >
            <Image
              source={require('../../assets/brand/icons/star-2.png')}
              style={{ width: 28, height: 28, opacity: isFavorited ? 1 : 0.5 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
        {data.celebrity ? (
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => Alert.alert(data.name, `Named by ${data.celebrity}\n\nMeaning: ${data.meaning}\nOrigin: ${data.origin}`)}
          >
            <Ionicons name="information-circle" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.content}>
          <View style={styles.nameWrap}>
            <Text
              style={styles.name}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              maxFontSizeMultiplier={1.2}
            >
              {surname ? `${data.name} ${surname}` : data.name}
            </Text>
          </View>
          <Text style={styles.details} maxFontSizeMultiplier={1.2}>{data.gender.toUpperCase()}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.meaningTitle} maxFontSizeMultiplier={1.3}>Meaning</Text>
            <Text style={styles.meaning} maxFontSizeMultiplier={1.3}>{data.meaning}</Text>
            <View style={styles.spacer} />
            <Text style={styles.originTitle} maxFontSizeMultiplier={1.3}>Origin</Text>
            <Text style={styles.origin} maxFontSizeMultiplier={1.3}>{data.origin}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.hint, styles.hintDislike]} maxFontSizeMultiplier={1.2}>← Dislike</Text>
          <Text style={[styles.hint, styles.hintLike]} maxFontSizeMultiplier={1.2}>Like →</Text>
        </View>
      </LinearGradient>
    </View>
  );
};
