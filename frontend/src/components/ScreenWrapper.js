import React from 'react';
import { SafeAreaView, View, StatusBar, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

const ScreenWrapper = ({ children, scroll = true, padded = true, keyboard = false }) => {
  const content = (
    <View style={[styles.inner, padded && styles.padded]}>
      {children}
    </View>
  );

  const wrapped = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : content;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {keyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {wrapped}
        </KeyboardAvoidingView>
      ) : wrapped}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 16 },
});

export default ScreenWrapper;
