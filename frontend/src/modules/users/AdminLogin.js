import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminLogin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();

  const validate = () => {
    const newErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(trimmedEmail)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await adminLogin(email.trim(), password);
      // Navigation handled by auth state change
    } catch (error) {
      Alert.alert('Admin Access Denied', error.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper keyboard padded={false}>
      <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
        <View style={styles.top}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconWrap, SHADOWS.glow]}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Secure access required to continue</Text>

          <View style={styles.card}>
            <CustomInput
              label="Admin Email"
              placeholder="admin@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
              keyboardType="email-address"
              error={errors.email}
              icon={<Ionicons name="mail" size={20} color={COLORS.textMuted} />}
            />
            <CustomInput
              label="Admin Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
              secureTextEntry
              error={errors.password}
              icon={<Ionicons name="key" size={20} color={COLORS.textMuted} />}
            />

            <CustomButton
              title="Authenticate"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
              icon={<Ionicons name="lock-closed" size={20} color="#FFF" />}
            />
          </View>
        </View>
      </LinearGradient>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: 20, paddingTop: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 60 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.glassBorder },
  title: { fontSize: SIZES.fontHero, ...FONTS.heavy, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: SIZES.fontMd, ...FONTS.medium, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: COLORS.surfaceLight, padding: 24, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.glassBorder },
  loginBtn: { marginTop: 16, height: 56 },
});

export default AdminLogin;
