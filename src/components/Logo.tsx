import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// The coral color matching the logo
export const LOGO_COLOR = '#C9817A';

const logoImage = require('../../assets/bump-match-logo.png');
const iconImage = require('../../assets/bump-match-icon.png');

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
  const tintColor = lightText ? '#FFFFFF' : undefined;

  return (
    <View style={styles.container}>
      {showIcon && (
        <Image
          source={iconImage}
          style={[{ width: icon, height: icon }, tintColor ? { tintColor } : null]}
          resizeMode="contain"
        />
      )}
      {showText && (
        <Image
          source={logoImage}
          style={[{ width: logoWidth, height: logoHeight, marginTop: 8 }, tintColor ? { tintColor } : null]}
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
  const tintColor = lightText ? '#FFFFFF' : undefined;

  return (
    <Image
      source={logoImage}
      style={[{ width, height }, tintColor ? { tintColor } : null, style]}
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
  const tintColor = lightIcon ? '#FFFFFF' : undefined;

  return (
    <Image
      source={iconImage}
      style={[{ width: s, height: s }, tintColor ? { tintColor } : null, style]}
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
