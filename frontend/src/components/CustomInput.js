import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  icon,
  editable = true,
  style,
  inputStyle,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrap,
        focused && styles.focused,
        error && styles.error,
        !editable && styles.disabled,
      ]}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...rest}
          style={[
            styles.input,
            icon && { paddingLeft: 0 },
            multiline && { height: numberOfLines * 24, textAlignVertical: 'top' },
            inputStyle,
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontBase,
    ...FONTS.medium,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  focused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  error: {
    borderColor: COLORS.error,
  },
  disabled: {
    opacity: 0.6,
  },
  iconWrap: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontMd,
    paddingVertical: 14,
    ...FONTS.regular,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fontSm,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default CustomInput;
