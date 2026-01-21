
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { AppTokens } from '../theme/designTokens';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled,
  loading
}) => {
  const getBackgroundColor = () => {
    if (disabled) return AppTokens.colors.grey;
    switch (variant) {
      case 'primary': return AppTokens.colors.primary;
      case 'secondary': return AppTokens.colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return AppTokens.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return AppTokens.colors.textDim;
    switch (variant) {
      case 'primary': return AppTokens.colors.textLight;
      case 'secondary': return AppTokens.colors.textLight;
      case 'outline': return AppTokens.colors.primary;
      case 'ghost': return AppTokens.colors.primary;
      default: return AppTokens.colors.textLight;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: AppTokens.spacing.m,
    paddingHorizontal: AppTokens.spacing.l,
    borderRadius: AppTokens.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: AppTokens.colors.primary,
  },
  text: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.body,
  },
});
