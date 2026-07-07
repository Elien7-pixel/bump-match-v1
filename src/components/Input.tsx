
import React from 'react';
import { TextInput, StyleSheet, View, Text, ViewStyle, TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  labelStyle?: any; // Using any for TextStyle to avoid import complexity, or could import TextStyle
}

export const Input: React.FC<InputProps> = ({ label, containerStyle, labelStyle, style, ...props }) => {
  const { theme } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      marginBottom: theme.spacing.m,
    },
    label: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: theme.typography.sizes.small,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.card, // white on cream (warm card in dark mode)
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      fontSize: theme.typography.sizes.body,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  }), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={theme.colors.grey}
        {...props}
      />
    </View>
  );
};
