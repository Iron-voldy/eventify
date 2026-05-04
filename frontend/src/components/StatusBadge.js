import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const StatusBadge = ({ status, size = 'sm' }) => {
  const getColor = () => {
    const s = status?.toLowerCase();
    if (['active', 'confirmed', 'visible', 'resolved', 'upcoming', 'completed'].includes(s)) return COLORS.success;
    if (['pending', 'pending_verification', 'in_progress', 'ongoing', 'open', 'medium'].includes(s)) return COLORS.warning;
    if (['cancelled', 'blocked', 'hidden', 'rejected', 'high', 'urgent'].includes(s)) return COLORS.error;
    if (['inactive', 'low'].includes(s)) return COLORS.textMuted;
    return COLORS.info;
  };

  const formatted = status?.replace('_', ' ')?.toUpperCase() || 'UNKNOWN';

  return (
    <View style={[styles.badge, { backgroundColor: getColor() + '20', borderColor: getColor() }, size === 'lg' && styles.lg]}>
      <View style={[styles.dot, { backgroundColor: getColor() }]} />
      <Text style={[styles.text, { color: getColor() }, size === 'lg' && styles.lgText]}>{formatted}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 0.5 },
  lg: { paddingHorizontal: 14, paddingVertical: 6 },
  lgText: { fontSize: SIZES.fontSm },
});

export default StatusBadge;
