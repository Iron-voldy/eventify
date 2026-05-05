import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

// ── Onboarding screen ── fully rewritten with modern dark purple design

const { width, height } = Dimensions.get('window');

const Onboarding = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#07000F', '#0F0025', '#1A0040', '#07000F']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
    >
      {/* Decorative glow blobs */}
      <View style={[styles.glow, { top: -80, right: -60, backgroundColor: 'rgba(124,58,237,0.18)' }]} />
      <View style={[styles.glow, { bottom: 80, left: -80, backgroundColor: 'rgba(236,72,153,0.12)', width: 260, height: 260, borderRadius: 130 }]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo icon */}
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBg}
          >
            <MaterialIcons name="event" size={40} color="#FFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>{'Discover &\nBook Events'}</Text>
        <Text style={styles.subtitle}>
          {'Premium tech, music and business experiences\ncrafted for the curious and ambitious.'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7C3AED', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => navigation.navigate('AdminLogin')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="admin-panel-settings" size={18} color="rgba(196,181,253,0.8)" />
            <Text style={styles.ghostBtnText}>Admin Access</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  iconWrap: {
    marginBottom: 36,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  subtitle: {
    color: 'rgba(196,181,253,0.8)',
    fontSize: SIZES.fontBase,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  actions: {
    width: '100%',
    gap: 14,
    marginBottom: 40,
  },
  primaryBtn: {
    borderRadius: SIZES.radiusFull,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.08)',
    gap: 8,
  },
  ghostBtnText: {
    color: 'rgba(196,181,253,0.85)',
    fontSize: SIZES.fontBase,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.3)',
  },
  dotActive: {
    width: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});

export default Onboarding;
