import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const AdminStatsCard = ({ title, value, icon, color = COLORS.primary, gradient }) => (
  <View style={[styles.card, SHADOWS.small]}>
    <LinearGradient
      colors={gradient || [color + '20', color + '08']}
      style={styles.gradient}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  gradient: {
    padding: 16,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontXxl,
    ...FONTS.bold,
    marginBottom: 2,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSm,
    ...FONTS.medium,
  },
});

export default AdminStatsCard;
