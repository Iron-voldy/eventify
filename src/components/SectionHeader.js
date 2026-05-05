import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const SectionHeader = ({ title, subtitle, actionText, onAction, icon }) => (
  <View style={styles.container}>
    <View style={styles.left}>
      {icon && <Ionicons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 8 }} />}
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
    {actionText && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.action}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.fontSm, marginTop: 2 },
  action: { color: COLORS.primary, fontSize: SIZES.fontBase, ...FONTS.semibold },
});

export default SectionHeader;
