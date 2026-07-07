
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.grey;
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'secondary': return theme.colors.card;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textDim;
    switch (variant) {
      case 'primary': return theme.colors.textLight;
      case 'secondary': return theme.colors.text;
      case 'outline': return theme.colors.primary;
      case 'ghost': return theme.colors.primary;
      default: return theme.colors.textLight;
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      borderRadius: theme.borderRadius.m,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondary: {
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    outline: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    text: {
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.body,
    },
  }), [theme]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        variant === 'secondary' && !disabled && styles.secondary,
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
