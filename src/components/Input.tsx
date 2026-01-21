
import React from 'react';
import { TextInput, StyleSheet, View, Text, ViewStyle, TextInputProps } from 'react-native';
import { AppTokens } from '../theme/designTokens';

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, containerStyle, style, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={AppTokens.colors.grey}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: AppTokens.spacing.m,
  },
  label: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.small,
    color: AppTokens.colors.text,
    marginBottom: AppTokens.spacing.xs,
    marginLeft: AppTokens.spacing.xs,
  },
  input: {
    backgroundColor: '#F3F4F6', // Light grey background
    borderRadius: AppTokens.borderRadius.m,
    padding: AppTokens.spacing.m,
    fontSize: AppTokens.typography.sizes.body,
    fontFamily: AppTokens.typography.fontFamily,
    color: AppTokens.colors.text,
  },
});
