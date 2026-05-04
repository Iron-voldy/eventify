import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // primary | secondary | outline | ghost | danger
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: SIZES.fontBase },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: SIZES.fontMd },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: SIZES.fontLg },
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[style]}
      >
        <LinearGradient
          colors={isDisabled ? ['#374151', '#374151'] : [COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            { paddingVertical: sizeStyles[size].paddingVertical, paddingHorizontal: sizeStyles[size].paddingHorizontal },
            SHADOWS.medium,
            styles.gradient,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }, icon && { marginLeft: 8 }]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    secondary: { bg: COLORS.surfaceLight, text: COLORS.primary, border: COLORS.primary },
    outline: { bg: 'transparent', text: COLORS.textPrimary, border: COLORS.glassBorder },
    ghost: { bg: 'transparent', text: COLORS.textSecondary, border: 'transparent' },
    danger: { bg: COLORS.error, text: '#FFF', border: COLORS.error },
  };

  const vs = variantStyles[variant] || variantStyles.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          backgroundColor: vs.bg,
          borderColor: vs.border,
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: vs.text, fontSize: sizeStyles[size].fontSize }, icon && { marginLeft: 8 }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    borderRadius: SIZES.radius,
  },
  text: {
    color: '#FFF',
    ...FONTS.semibold,
    letterSpacing: 0.5,
  },
});

export default CustomButton;
