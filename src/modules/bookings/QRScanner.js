import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { bookingAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const StatusColor = {
  confirmed: '#4ade80',
  cancelled: '#f87171',
  pending: '#fbbf24',
};

const QRScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // data should be the booking ID (24-char MongoDB ObjectId)
      const res = await bookingAPI.scanQR(data.trim());
      setResult(res.data);
      setModalVisible(true);
    } catch (err) {
      setError(err.message || 'Invalid QR code or booking not found');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanned(false);
    setResult(null);
    setError(null);
    setModalVisible(false);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={60} color={COLORS.primary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan booking QR codes.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const booking = result;
  const event = booking?.eventId;
  const user = booking?.userId;

  const avatarSource = user?.profileImage
    ? { uri: user.profileImage.startsWith('http') ? user.profileImage : `${API_URL}${user.profileImage}` }
    : null;

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.topArea}>
          <Text style={styles.headerTitle}>Scan Booking QR</Text>
          <Text style={styles.headerSub}>Point camera at attendee's QR code</Text>
        </View>

        {/* Scanner frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Looking up booking…</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomArea}>
          {scanned && !loading && (
            <TouchableOpacity style={styles.rescanBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.rescanText}>Scan Another QR</Text>
            </TouchableOpacity>
          )}
          {!scanned && (
            <Text style={styles.scanHint}>Align QR code within the frame</Text>
          )}
        </View>
      </View>

      {/* Result / Error Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={handleReset}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {error ? (
              /* ── Error State ── */
              <View style={styles.errorBlock}>
                <Ionicons name="alert-circle" size={52} color="#f87171" />
                <Text style={styles.errorTitle}>QR Code Invalid</Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <TouchableOpacity style={styles.rescanBtnModal} onPress={handleReset}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.rescanText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : booking ? (
              /* ── Booking Details ── */
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: (StatusColor[booking.bookingStatus] || '#9ca3af') + '22' }]}>
                  <View style={[styles.statusDot, { backgroundColor: StatusColor[booking.bookingStatus] || '#9ca3af' }]} />
                  <Text style={[styles.statusText, { color: StatusColor[booking.bookingStatus] || '#9ca3af' }]}>
                    {booking.bookingStatus.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>ATTENDEE</Text>
                {/* User Card */}
                <View style={styles.userCard}>
                  {avatarSource ? (
                    <Image source={avatarSource} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {(user?.fullName || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.fullName || 'Unknown'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    {user?.phoneNumber ? <Text style={styles.userPhone}>{user.phoneNumber}</Text> : null}
                  </View>
                </View>

                <Text style={styles.sectionLabel}>EVENT</Text>
                <View style={styles.detailCard}>
                  <DetailRow icon="calendar-outline" label="Event" value={event?.title || '—'} />
                  <DetailRow
                    icon="time-outline"
                    label="Date"
                    value={event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    }) : '—'}
                  />
                  <DetailRow icon="location-outline" label="Location" value={event?.location || '—'} />
                </View>

                <Text style={styles.sectionLabel}>BOOKING</Text>
                <View style={styles.detailCard}>
                  <DetailRow
                    icon="barcode-outline"
                    label="Booking ID"
                    value={`#${booking._id.slice(-8).toUpperCase()}`}
                    mono
                  />
                  <DetailRow icon="ticket-outline" label="Tickets" value={`${booking.quantity}`} />
                  <DetailRow icon="cash-outline" label="Amount Paid" value={`LKR ${booking.finalAmount}`} />
                  {booking.discountAmount > 0 && (
                    <DetailRow icon="pricetag-outline" label="Discount" value={`LKR ${booking.discountAmount}`} />
                  )}
                  <DetailRow
                    icon="calendar-outline"
                    label="Booked On"
                    value={new Date(booking.bookingDate || booking.createdAt).toLocaleDateString()}
                  />
                </View>

                <TouchableOpacity style={styles.rescanBtnModal} onPress={handleReset}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.rescanText}>Scan Another</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ icon, label, value, mono = false }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color={COLORS.primary} style={{ marginTop: 1 }} />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, mono && { fontFamily: 'monospace' }]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 24 },
  permissionCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, maxWidth: 320 },
  permissionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  permissionText: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  permissionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: SIZES.radiusFull },
  permissionBtnText: { color: '#fff', fontSize: SIZES.fontBase, ...FONTS.semibold },

  // Overlay
  overlay: { flex: 1, justifyContent: 'space-between' },
  topArea: { paddingTop: 60, paddingHorizontal: 24, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: SIZES.fontXl, ...FONTS.bold, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: SIZES.fontSm, marginTop: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  // Frame
  frameContainer: { alignItems: 'center', justifyContent: 'center' },
  frame: { width: 260, height: 260, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: COLORS.primary, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  loadingOverlay: { alignItems: 'center', gap: 10 },
  loadingText: { color: '#fff', fontSize: SIZES.fontSm, ...FONTS.medium },

  // Bottom
  bottomArea: { paddingBottom: 60, alignItems: 'center' },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.fontSm, textAlign: 'center' },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: SIZES.radiusFull },
  rescanText: { color: '#fff', fontSize: SIZES.fontBase, ...FONTS.semibold },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', borderTopWidth: 1, borderColor: COLORS.glassBorder },
  modalClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 6 },

  // Error
  errorBlock: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  errorTitle: { color: '#f87171', fontSize: SIZES.fontXl, ...FONTS.bold },
  errorMsg: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, textAlign: 'center', lineHeight: 22 },

  // Status banner
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: SIZES.radiusFull, alignSelf: 'flex-start', marginBottom: 20, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: SIZES.fontSm, ...FONTS.bold, letterSpacing: 0.5 },

  // Section
  sectionLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },

  // User card
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: SIZES.fontXl, ...FONTS.bold },
  userInfo: { flex: 1 },
  userName: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: 2 },
  userEmail: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
  userPhone: { color: COLORS.textMuted, fontSize: SIZES.fontSm, marginTop: 2 },

  // Detail card
  detailCard: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailLabel: { color: COLORS.textMuted, fontSize: SIZES.fontSm, width: 90 },
  detailValue: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.medium, textAlign: 'right' },

  rescanBtnModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: SIZES.radiusFull, marginTop: 4, marginBottom: 8 },
});

export default QRScanner;
