import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Brand } from '../theme/designTokens';

// Brand primary colour (pastel purple from the Bump Match CI)
export const LOGO_COLOR = Brand.pink;

// Horizontal wordmark WITH tagline (1755x484 → aspect ratio ~3.63:1)
const logoImage = require('../../assets/brand/logo-horizontal-tagline.png');
const logoImageWhite = require('../../assets/brand/logo-horizontal-tagline-white.png');
// Horizontal wordmark WITHOUT tagline — tagline blanked on the full 1755x484
// canvas so the wordmark keeps the exact size/position of the tagline version
// (same aspect), just without the text line — never zoomed or cropped.
const logoNoTag = require('../../assets/brand/logo-horizontal.png');
const logoNoTagWhite = require('../../assets/brand/logo-horizontal-white.png');
// "B" mother-and-baby mark (1735x2443 → taller than wide)
const iconImage = require('../../assets/brand/logo-mark-purple.png');
const iconImageWhite = require('../../assets/brand/logo-mark-white.png');

const TAGLINE_ASPECT = 3.63;
const NO_TAGLINE_ASPECT = 3.63; // same canvas as the tagline version

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

// Just the wordmark. Pass showTagline={false} for the in-app header where the
// "Swipe your way to your baby's name" line should not appear under the logo.
export const LogoText = ({
  size = 'medium',
  lightText = false,
  showTagline = true,
  style,
}: {
  size?: 'small' | 'medium' | 'large';
  lightText?: boolean;
  showTagline?: boolean;
  style?: any;
}) => {
  const heights = { small: 28, medium: 40, large: 80 };
  const height = heights[size];
  const aspect = showTagline ? TAGLINE_ASPECT : NO_TAGLINE_ASPECT;
  const width = Math.round(height * aspect);

  const source = showTagline
    ? (lightText ? logoImageWhite : logoImage)
    : (lightText ? logoNoTagWhite : logoNoTag);

  return (
    <Image
      source={source}
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
