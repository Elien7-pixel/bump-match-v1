import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BabyName } from '../models/BabyName';
import { useTheme } from '../context/ThemeContext';

interface ShareNameCardProps {
  data: BabyName;
  surname?: string;
  onLayout?: () => void;
}

// Fixed logical size, captured at an explicit pixel size (1080×1350) so the
// exported image is device-independent and high resolution. Rendered
// off-screen only — no interactive elements, no store links on the image.
export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 450;

export const ShareNameCard = forwardRef<View, ShareNameCardProps>(
  ({ data, surname, onLayout }, ref) => {
    const { theme } = useTheme();

    const gradientColors =
      data.gender === 'boy'
        ? ([theme.colors.boyBlue, theme.brand.tealDeep] as const)
        : data.gender === 'girl'
          ? ([theme.colors.girlPink, theme.brand.pinkDeep] as const)
          : ([theme.brand.purple, theme.brand.purpleDeep] as const);

    const styles = StyleSheet.create({
      container: {
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
      },
      card: {
        flex: 1,
        padding: theme.spacing.l,
        justifyContent: 'space-between',
      },
      content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      },
      nameWrap: {
        height: 96,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.s,
      },
      name: {
        fontFamily: theme.typography.fontFamilyDisplay,
        fontSize: 40,
        lineHeight: 48,
        color: theme.colors.textLight,
        textShadowColor: 'rgba(74, 68, 89, 0.25)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.s,
        includeFontPadding: false,
      },
      details: {
        fontFamily: theme.typography.fontFamilySemiBold,
        fontSize: theme.typography.sizes.h3,
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 2,
        marginBottom: theme.spacing.l,
        includeFontPadding: false,
      },
      infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        width: '100%',
        alignItems: 'center',
      },
      infoTitle: {
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
      origin: {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.sizes.body,
        color: theme.colors.textLight,
      },
      spacer: {
        height: theme.spacing.s,
      },
      footer: {
        alignItems: 'center',
        paddingTop: theme.spacing.m,
      },
      logo: {
        width: 150,
        height: 34,
      },
    });

    return (
      <View ref={ref} collapsable={false} style={styles.container} onLayout={onLayout}>
        <LinearGradient
          colors={gradientColors}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.nameWrap}>
              <Text
                style={styles.name}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                allowFontScaling={false}
              >
                {surname ? `${data.name} ${surname}` : data.name}
              </Text>
            </View>
            <Text style={styles.details} allowFontScaling={false}>
              {data.gender.toUpperCase()}
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle} allowFontScaling={false}>Meaning</Text>
              <Text style={styles.meaning} allowFontScaling={false}>{data.meaning}</Text>
              <View style={styles.spacer} />
              <Text style={styles.infoTitle} allowFontScaling={false}>Origin</Text>
              <Text style={styles.origin} allowFontScaling={false}>{data.origin}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Image
              source={require('../../assets/brand/logo-horizontal-white.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </View>
    );
  }
);

ShareNameCard.displayName = 'ShareNameCard';
