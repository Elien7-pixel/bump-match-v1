import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { BabyName } from '../models/BabyName';
import { useTheme } from '../context/ThemeContext';
import { useAccountSurname } from '../hooks/useAccountSurname';

interface NameCardProps {
  data: BabyName;
  onFavorite?: (name: BabyName) => void;
  isFavorited?: boolean;
  // Animated background colour layer driven by swipe direction (sits between
  // the gradient and the content so the card itself appears to change colour).
  tintStyle?: any;
  // Height actually free for the deck, measured by the screen. Without it the
  // card falls back to a share of the viewport, which overflows the stack on
  // short screens where the chrome above and below leaves less than that.
  availableHeight?: number;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const NameCard: React.FC<NameCardProps> = ({ data, onFavorite, isFavorited, tintStyle, availableHeight }) => {
  const { theme } = useTheme();
  const surname = useAccountSurname();
  const { width, height } = useWindowDimensions();
  const CARD_WIDTH = Math.min(width * 0.80, 380);
  // Clamp to the space the deck actually has, so the card can never overflow
  // into the search bar above or the action buttons below. availableHeight is
  // the measured stack area; the viewport share is only a first-frame fallback.
  const VERTICAL_BUDGET = availableHeight && availableHeight > 0
    ? availableHeight - 8
    : height * 0.52;
  const CARD_HEIGHT = Math.max(180, Math.min(CARD_WIDTH * 1.2, VERTICAL_BUDGET));
  // The card is a fixed-size box wedged between the filter chips and the action
  // buttons, so it cannot grow with the OS font scale — at scale 1.3 the content
  // column outgrew it and the title painted over the filters. Pin the card's own
  // typography to the design size instead; the rest of the app still scales.
  const CARD_TEXT_SCALE = 1;
  // On a 360x800dp phone (720x1600 HD+, very common on budget Android) the card
  // hits the height*0.52 clamp and comes out ~25% shorter than on a large phone,
  // but the interior type and spacing were fixed — so the content column no
  // longer fit and a wrapped "FirstName Surname" spilled out of the card. Scale
  // the whole interior by how much the card actually shrank.
  const DESIGN_HEIGHT = 380 * 1.2; // card height on a large phone
  const s = Math.max(0.6, Math.min(1, CARD_HEIGHT / DESIGN_HEIGHT));
  const sp = (n: number) => Math.round(n * s);
  const NAME_FONT = Math.max(24, Math.round(44 * s));
  const NAME_LINE = Math.round(NAME_FONT * 1.18);

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
      padding: sp(theme.spacing.l),
      justifyContent: 'space-around',
      // Safety net: whatever the font scale, content is clipped to the card
      // rather than painting over the filter chips sitting above it.
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sp(theme.spacing.m),
    },
    // Two-line box: a long "FirstName Surname" wraps (surname on its own line)
    // instead of tail-ellipsizing. minHeight (not height) reserves the space so
    // the card layout stays identical for one- and two-line titles, while still
    // letting the box grow rather than spilling its text outside the card.
    nameWrap: {
      minHeight: NAME_LINE * 2,
      alignSelf: 'stretch',
      // Row + wrap: name and surname are separate Text nodes (a single
      // concatenated string got its tail clipped by Android with this display
      // font), but they still share a line when they fit and only wrap when
      // they don't — so short names don't waste a second line.
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      // Keep clear of the favourite star (top-left) and info button (top-right),
      // which are absolutely positioned over this row.
      paddingHorizontal: sp(46),
      marginBottom: sp(theme.spacing.s),
    },
    name: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: NAME_FONT,
      color: theme.colors.textLight,
      textShadowColor: 'rgba(74, 68, 89, 0.25)',
      textShadowOffset: { width: 1, height: 2 },
      textShadowRadius: 4,
      lineHeight: NAME_LINE,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.s,
      includeFontPadding: false,
    },
    details: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: Math.round(theme.typography.sizes.h3 * s),
      color: 'rgba(255, 255, 255, 0.9)',
      letterSpacing: 2,
      marginBottom: sp(theme.spacing.xl),
    },
    infoBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.l,
      padding: sp(theme.spacing.l),
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
      fontSize: Math.round(theme.typography.sizes.h3 * s),
      color: theme.colors.textLight,
      textAlign: 'center',
      marginBottom: sp(theme.spacing.m),
    },
    spacer: {
      height: sp(theme.spacing.s),
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
      marginTop: sp(theme.spacing.m),
      marginBottom: sp(theme.spacing.s),
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
  }), [theme, CARD_WIDTH, CARD_HEIGHT, NAME_FONT, NAME_LINE, s]);

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
            {/* The card is a fixed-size box, so the OS font scale is capped at
                1 for the title only — at 44pt it is already the largest text on
                screen, and letting it grow is what pushed two lines out of the
                card. Every other label on the card still scales. */}
            <Text style={[styles.name, surname ? { marginRight: Math.round(NAME_FONT * 0.28) } : null]} maxFontSizeMultiplier={CARD_TEXT_SCALE}>{data.name}</Text>
            {surname ? (
              // Separate Text nodes rather than one concatenated string:
              // Android clipped the trailing word of a single-line string with
              // this display font, dropping the surname. See LikedNamesScreen.
              <Text style={styles.name} maxFontSizeMultiplier={CARD_TEXT_SCALE}>{surname}</Text>
            ) : null}
          </View>
          <Text style={styles.details} maxFontSizeMultiplier={CARD_TEXT_SCALE}>{data.gender.toUpperCase()}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.meaningTitle} maxFontSizeMultiplier={CARD_TEXT_SCALE}>Meaning</Text>
            <Text style={styles.meaning} maxFontSizeMultiplier={CARD_TEXT_SCALE}>{data.meaning}</Text>
            <View style={styles.spacer} />
            <Text style={styles.originTitle} maxFontSizeMultiplier={CARD_TEXT_SCALE}>Origin</Text>
            <Text style={styles.origin} maxFontSizeMultiplier={CARD_TEXT_SCALE}>{data.origin}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.hint, styles.hintDislike]} maxFontSizeMultiplier={CARD_TEXT_SCALE}>← Dislike</Text>
          <Text style={[styles.hint, styles.hintLike]} maxFontSizeMultiplier={CARD_TEXT_SCALE}>Like →</Text>
        </View>
      </LinearGradient>
    </View>
  );
};
