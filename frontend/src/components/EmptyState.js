import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const EmptyState = ({ icon = 'folder-open-outline', title = 'Nothing here yet', subtitle = '', style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={48} color={COLORS.primary} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.semibold, marginBottom: 8, textAlign: 'center' },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.fontBase, textAlign: 'center', maxWidth: 260 },
});

export default EmptyState;
