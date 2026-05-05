import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const LoadingSpinner = ({ text = 'Loading...', fullScreen = true }) => (
  <View style={[styles.container, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  fullScreen: { flex: 1, backgroundColor: COLORS.background },
  text: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.regular, marginTop: 12 },
});

export default LoadingSpinner;
