import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const BG_COLORS = ['#07000F', '#14003A', '#1A0050', '#100035', '#07000F'];

const Splash = ({ navigation }) => {
  const { loading, isLoggedIn } = useAuth();
  const colorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
    ]).start();

    // Gradient color cycling loop
    const cycleColors = () => {
      Animated.sequence([
        Animated.timing(colorAnim, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 2, duration: 1600, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 3, duration: 1600, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 4, duration: 1600, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ]).start(() => cycleColors());
    };
    cycleColors();
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => {
        if (!isLoggedIn) navigation.replace('Onboarding');
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [loading, isLoggedIn, navigation]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: BG_COLORS,
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../../assets/loader.gif')}
          style={styles.gif}
          resizeMode="contain"
        />
        <Text style={styles.appName}>EVENTIFY</Text>
        <Text style={styles.tagline}>Premium Event Experiences</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />)}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center' },
  gif: { width: 180, height: 180, marginBottom: 28 },
  appName: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 10,
    textTransform: 'uppercase',
  },
  tagline: {
    color: 'rgba(167, 139, 250, 0.9)',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 10,
    letterSpacing: 2.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#8B5CF6',
  },
});

export default Splash;
