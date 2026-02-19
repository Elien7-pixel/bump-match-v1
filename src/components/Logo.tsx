import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';

// The coral color matching the heart logo
export const LOGO_COLOR = '#C9817A';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showIcon?: boolean;
  lightText?: boolean;
}

export const Logo = ({
  size = 'medium',
  showText = true,
  showIcon = true,
  lightText = false,
}: LogoProps) => {
  const dimensions = {
    small: { icon: 32, fontSize: 20, italicSize: 20 },
    medium: { icon: 48, fontSize: 32, italicSize: 32 },
    large: { icon: 64, fontSize: 42, italicSize: 42 },
  };

  const { icon, fontSize, italicSize } = dimensions[size];
  const textColor = lightText ? '#FFFFFF' : LOGO_COLOR;

  return (
    <View style={styles.container}>
      {showIcon && (
        <Image
          source={require('../../assets/heart-logo.png')}
          style={{ width: icon, height: icon }}
          resizeMode="contain"
        />
      )}
      {showText && (
        <Text style={[styles.logoText, { fontSize, color: textColor }]}>
          Bump<Text style={[styles.logoTextItalic, { fontSize: italicSize, color: textColor }]}>Match</Text>
        </Text>
      )}
    </View>
  );
};

// Just the text portion of the logo
export const LogoText = ({
  size = 'medium',
  lightText = false,
  style,
}: {
  size?: 'small' | 'medium' | 'large';
  lightText?: boolean;
  style?: any;
}) => {
  const fontSizes = {
    small: 20,
    medium: 32,
    large: 42,
  };

  const textColor = lightText ? '#FFFFFF' : LOGO_COLOR;

  return (
    <Text style={[styles.logoText, { fontSize: fontSizes[size], color: textColor }, style]}>
      Bump<Text style={[styles.logoTextItalic, { color: textColor }]}>Match</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  logoTextItalic: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia-BoldItalic' : 'serif',
    fontStyle: 'italic',
    fontWeight: '700',
  },
});

export default Logo;
