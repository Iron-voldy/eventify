import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const Bookings = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModal, setQrModal] = useState({ visible: false, booking: null });
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.getMy();
      setBookings(res.data);
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking for "${booking.eventId?.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(booking._id);
              await bookingAPI.cancel(booking._id);
              fetchBookings();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel booking');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const renderBookingItem = ({ item }) => {
    const event = item.eventId;
    if (!event) return null;

    const imageSource = event.eventImage
      ? { uri: event.eventImage.startsWith('http') ? event.eventImage : `${API_URL}${event.eventImage}` }
      : null;
    const paymentSlipSource = item.paymentSlipImage
      ? { uri: item.paymentSlipImage.startsWith('http') ? item.paymentSlipImage : `${API_URL}${item.paymentSlipImage}` }
      : null;

    const canCancel = event.status === 'upcoming' && item.bookingStatus !== 'cancelled';
    const isConfirmed = item.bookingStatus === 'confirmed' && item.paymentStatus === 'completed';
    const isPendingReview = item.paymentStatus === 'pending_verification';

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>ID: ...{item._id.slice(-6).toUpperCase()}</Text>
          <View style={styles.badges}>
            <StatusBadge status={item.bookingStatus} size="sm" />
            <StatusBadge status={item.paymentStatus} size="sm" />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EventDetails', { id: event._id })}
          style={styles.eventInfo}
        >
          {imageSource ? (
            <Image source={imageSource} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.details}>
            <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.date}>{new Date(event.eventDate).toLocaleDateString()}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{event.location}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View>
            <Text style={styles.label}>TICKETS</Text>
            <Text style={styles.value}>{item.quantity} x LKR {event.ticketPrice}</Text>
          </View>
          <View style={styles.footerCenter}>
            <Text style={styles.label}>PAYMENT</Text>
            <Text style={styles.value}>{item.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Online'}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.label}>TOTAL</Text>
            <Text style={styles.totalValue}>LKR {item.finalAmount}</Text>
          </View>
        </View>

        {isPendingReview ? (
          <View style={styles.noticeBox}>
            <Ionicons name="time-outline" size={16} color={COLORS.warning} />
            <Text style={styles.noticeText}>
              Transfer slip submitted. Your booking will be confirmed after admin verification.
            </Text>
          </View>
        ) : null}

        {paymentSlipSource ? (
          <View style={styles.slipBlock}>
            <Text style={styles.label}>TRANSFER SLIP</Text>
            <Image source={paymentSlipSource} style={styles.slipImage} />
          </View>
        ) : null}

        {isConfirmed ? (
          <TouchableOpacity
            style={styles.btnQR}
            onPress={() => setQrModal({ visible: true, booking: item })}
          >
            <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
            <Text style={styles.btnQRText}>View Entry QR Code</Text>
          </TouchableOpacity>
        ) : null}

        {canCancel ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnAction} onPress={() => navigation.navigate('EventDetails', { id: event._id })}>
              <Text style={styles.btnActionText}>View Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnActionSecondary, cancelling === item._id && { opacity: 0.5 }]}
              onPress={() => handleCancelBooking(item)}
              disabled={cancelling === item._id}
            >
              <Text style={styles.btnActionTextSecondary}>
                {cancelling === item._id ? 'Cancelling...' : 'Cancel Booking'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.pageTitle}>My Bookings</Text>

      <Modal
        visible={qrModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModal({ visible: false, booking: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setQrModal({ visible: false, booking: null })}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Entry QR Code</Text>
            {qrModal.booking ? (
              <>
                <Text style={styles.modalEvent} numberOfLines={2}>
                  {qrModal.booking.eventId?.title}
                </Text>
                <Text style={styles.modalDate}>
                  {qrModal.booking.eventId?.eventDate
                    ? new Date(qrModal.booking.eventId.eventDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </Text>

                <View style={styles.qrWrapper}>
                  <QRCode
                    value={qrModal.booking._id}
                    size={220}
                    backgroundColor="#ffffff"
                    color="#1a0035"
                  />
                </View>

                <Text style={styles.modalBookingId}>
                  Booking #{qrModal.booking._id.slice(-8).toUpperCase()}
                </Text>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="ticket-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.modalInfoText}>
                    {qrModal.booking.quantity} ticket{qrModal.booking.quantity > 1 ? 's' : ''} · LKR {qrModal.booking.finalAmount}
                  </Text>
                </View>
                <Text style={styles.modalHint}>Show this QR code at the event entrance.</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={COLORS.primary} />}
          renderItem={renderBookingItem}
          ListEmptyComponent={
            <EmptyState icon="ticket-outline" title="No bookings found" subtitle="When you book tickets to events, they will appear here." />
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 16 },
  listContent: { paddingBottom: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  bookingId: { color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium },
  eventInfo: { flexDirection: 'row', gap: 12 },
  image: { width: 70, height: 70, borderRadius: SIZES.radiusSm },
  imageFallback: { backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, justifyContent: 'center' },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 4 },
  date: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 2 },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerCenter: { alignItems: 'center' },
  footerRight: { alignItems: 'flex-end' },
  label: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 0.5, marginBottom: 2 },
  value: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.medium },
  totalValue: { color: COLORS.secondary, fontSize: SIZES.fontLg, ...FONTS.bold },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
    backgroundColor: COLORS.warning + '12',
  },
  noticeText: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.medium, lineHeight: 19 },
  slipBlock: { marginTop: 14 },
  slipImage: { width: '100%', height: 170, borderRadius: SIZES.radiusSm, marginTop: 8 },
  btnQR: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  btnQRText: { color: COLORS.primary, fontSize: SIZES.fontBase, ...FONTS.semibold },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  btnAction: { flex: 1, backgroundColor: COLORS.surfaceLight, paddingVertical: 10, borderRadius: SIZES.radius, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  btnActionText: { color: COLORS.primary, fontSize: SIZES.fontBase, ...FONTS.semibold },
  btnActionSecondary: { flex: 1, backgroundColor: 'transparent', paddingVertical: 10, borderRadius: SIZES.radius, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  btnActionTextSecondary: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 4 },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold, marginBottom: 8 },
  modalEvent: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, textAlign: 'center', marginBottom: 4, paddingHorizontal: 16 },
  modalDate: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 20 },
  qrWrapper: { padding: 16, backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16 },
  modalBookingId: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.bold, fontFamily: 'monospace', marginBottom: 6 },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  modalInfoText: { color: COLORS.textMuted, fontSize: SIZES.fontSm },
  modalHint: { color: COLORS.textMuted, fontSize: SIZES.fontXs, textAlign: 'center', fontStyle: 'italic' },
});

export default Bookings;
