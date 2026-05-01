import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

const Register = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    const { fullName, email, password, confirmPassword, phoneNumber } = formData;
    const trimName = fullName.trim();
    const trimEmail = email.trim();
    const trimPhone = phoneNumber.trim();

    if (!trimName) newErrors.fullName = 'Full name is required';
    else if (trimName.length < 2) newErrors.fullName = 'Name must be at least 2 characters';
    else if (trimName.length > 50) newErrors.fullName = 'Name must be 50 characters or fewer';

    if (!trimEmail) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(trimEmail)) newErrors.email = 'Enter a valid email address';

    if (trimPhone && !PHONE_REGEX.test(trimPhone)) newErrors.phoneNumber = 'Enter a valid phone number (e.g. +94771234567)';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/\d/.test(password)) newErrors.password = 'Password must contain at least one number';

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const { fullName, email, password, phoneNumber } = formData;
    setLoading(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password, phoneNumber: phoneNumber.trim() });
      // Navigation handled by auth state change
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper keyboard>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Join Eventify</Text>
          <Text style={styles.subtitle}>Start experiencing premium events</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Full Name *"
            placeholder="John Doe"
            value={formData.fullName}
            onChangeText={(t) => handleChange('fullName', t)}
            error={errors.fullName}
            icon={<Ionicons name="person-outline" size={20} color={COLORS.textMuted} />}
          />
          <CustomInput
            label="Email Address *"
            placeholder="john@example.com"
            value={formData.email}
            onChangeText={(t) => handleChange('email', t)}
            keyboardType="email-address"
            error={errors.email}
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />}
          />
          <CustomInput
            label="Phone Number"
            placeholder="+94771234567"
            value={formData.phoneNumber}
            onChangeText={(t) => handleChange('phoneNumber', t)}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
            icon={<Ionicons name="call-outline" size={20} color={COLORS.textMuted} />}
          />
          <CustomInput
            label="Password *"
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(t) => handleChange('password', t)}
            secureTextEntry
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />}
          />
          <CustomInput
            label="Confirm Password *"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChangeText={(t) => handleChange('confirmPassword', t)}
            secureTextEntry
            error={errors.confirmPassword}
            icon={<Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textMuted} />}
          />
        </View>

        <CustomButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerBtn}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: SIZES.fontLg, ...FONTS.bold, color: COLORS.textPrimary, marginRight: 40 },
  content: { flex: 1 },
  titleWrap: { marginBottom: 32 },
  title: { fontSize: SIZES.fontXxxl, ...FONTS.bold, color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: SIZES.fontBase, ...FONTS.regular, color: COLORS.textSecondary },
  form: { marginBottom: 32 },
  registerBtn: { marginBottom: 24, height: 56 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  footerText: { color: COLORS.textSecondary, fontSize: SIZES.fontBase },
  loginText: { color: COLORS.primary, fontSize: SIZES.fontBase, ...FONTS.bold },
});

export default Register;
