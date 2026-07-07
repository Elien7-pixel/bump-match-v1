import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Brand } from '../theme/designTokens';

// Brand primary colour (pastel purple from the Bump Match CI)
export const LOGO_COLOR = Brand.purple;

// Horizontal wordmark with tagline (1755x484 → aspect ratio ~3.63:1)
const logoImage = require('../../assets/brand/logo-horizontal-tagline.png');
const logoImageWhite = require('../../assets/brand/logo-horizontal-tagline-white.png');
// "B" mother-and-baby mark (1735x2443 → taller than wide)
const iconImage = require('../../assets/brand/logo-mark-purple.png');
const iconImageWhite = require('../../assets/brand/logo-mark-white.png');

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
    small: { icon: 32, logoHeight: 28, logoWidth: 100 },
    medium: { icon: 48, logoHeight: 40, logoWidth: 144 },
    large: { icon: 64, logoHeight: 56, logoWidth: 200 },
  };

  const { icon, logoHeight, logoWidth } = dimensions[size];

  return (
    <View style={styles.container}>
      {showIcon && (
        <Image
          source={lightText ? iconImageWhite : iconImage}
          style={{ width: icon, height: icon }}
          resizeMode="contain"
        />
      )}
      {showText && (
        <Image
          source={lightText ? logoImageWhite : logoImage}
          style={{ width: logoWidth, height: logoHeight, marginTop: 8 }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

// Just the text/logo portion
export const LogoText = ({
  size = 'medium',
  lightText = false,
  style,
}: {
  size?: 'small' | 'medium' | 'large';
  lightText?: boolean;
  style?: any;
}) => {
  const dimensions = {
    small: { height: 28, width: 100 },
    medium: { height: 40, width: 144 },
    large: { height: 80, width: 288 },
  };

  const { height, width } = dimensions[size];

  return (
    <Image
      source={lightText ? logoImageWhite : logoImage}
      style={[{ width, height }, style]}
      resizeMode="contain"
    />
  );
};

// Just the icon
export const LogoIcon = ({
  size = 'medium',
  lightIcon = false,
  style,
}: {
  size?: 'small' | 'medium' | 'large';
  lightIcon?: boolean;
  style?: any;
}) => {
  const dimensions = {
    small: { s: 24 },
    medium: { s: 40 },
    large: { s: 56 },
  };

  const { s } = dimensions[size];

  return (
    <Image
      source={lightIcon ? iconImageWhite : iconImage}
      style={[{ width: s, height: s }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
