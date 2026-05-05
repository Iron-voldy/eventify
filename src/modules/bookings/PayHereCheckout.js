import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { paymentAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

// These URLs are intercepted in-app — they don't need to be real pages
const SUCCESS_PATTERNS = ['eventify.app/payment/success', '/api/payments/return'];
const CANCEL_PATTERNS = ['eventify.app/payment/cancel', '/api/payments/cancel'];

const PayHereCheckout = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  // Load the form from our own backend server so the HTTP origin is our server IP,
  // not null/about:blank — PayHere checks origin against the registered domain (localhost)
  const webviewUrl = `${API_URL}/api/payments/webview/${bookingId}`;

  console.log('[PayHereCheckout] bookingId:', bookingId);
  console.log('[PayHereCheckout] webviewUrl:', webviewUrl);

  const handleNavChange = async (navState) => {
    console.log('[PayHereCheckout] Nav:', navState.url);
    if (processedRef.current) return;
    const url = navState.url || '';

    if (SUCCESS_PATTERNS.some((pattern) => url.includes(pattern))) {
      processedRef.current = true;
      try {
        await paymentAPI.confirm(bookingId);
      } catch (_) {
        // Notify URL may have already confirmed — continue regardless
      }
      Alert.alert(
        'Payment Successful!',
        'Your booking is confirmed. A QR ticket has been sent to your email.',
        [{ text: 'View Bookings', onPress: () => navigation.replace('UserRoot', { screen: 'Bookings' }) }]
      );
    } else if (CANCEL_PATTERNS.some((pattern) => url.includes(pattern))) {
      processedRef.current = true;
      Alert.alert(
        'Payment Cancelled',
        'Your payment was cancelled. The booking has been released.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[PayHereCheckout] WebView error:', JSON.stringify(nativeEvent));
    Alert.alert('Connection Error', 'Could not connect to PayHere. Please check your internet and try again.', [
      { text: 'Go Back', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Connecting to PayHere Sandbox...</Text>
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ uri: webviewUrl }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavChange}
        onError={handleError}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium },
  webview: { flex: 1 },
});

export default PayHereCheckout;
