import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingAPI.getAll();
      setBookings(res.data);
    } catch (error) {
      console.log('Error fetching admin bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const handleCancel = (booking) => {
    Alert.alert('Cancel Booking', `Cancel booking for ${booking.userId?.fullName || 'this user'}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingAPI.cancel(booking._id);
            fetchBookings();
          } catch (error) {
            Alert.alert('Error', error.message || 'Could not cancel booking');
          }
        },
      },
    ]);
  };

  const handleReview = async (booking, action) => {
    try {
      setReviewingId(booking._id);
      await bookingAPI.reviewPayment(booking._id, {
        action,
        verificationNote: action === 'approve' ? 'Bank transfer verified by admin.' : 'Payment proof was rejected by admin.',
      });
      fetchBookings();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not update payment review');
    } finally {
      setReviewingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const paymentSlipSource = item.paymentSlipImage
      ? { uri: item.paymentSlipImage.startsWith('http') ? item.paymentSlipImage : `${API_URL}${item.paymentSlipImage}` }
      : null;

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>ID: ...{item._id.slice(-6).toUpperCase()}</Text>
          <View style={styles.badges}>
            <StatusBadge status={item.bookingStatus} size="sm" />
            <StatusBadge status={item.paymentStatus} size="sm" />
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.primary} style={styles.icon} />
          <View style={styles.infoTexts}>
            <Text style={styles.infoLabel}>User</Text>
            <Text style={styles.infoValue}>{item.userId?.fullName || 'Unknown'} ({item.userId?.email || 'N/A'})</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} style={styles.icon} />
          <View style={styles.infoTexts}>
            <Text style={styles.infoLabel}>Event</Text>
            <Text style={styles.infoValue}>{item.eventId?.title || 'Unknown Event'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="wallet-outline" size={16} color={COLORS.warning} style={styles.icon} />
          <View style={styles.infoTexts}>
            <Text style={styles.infoLabel}>Payment</Text>
            <Text style={styles.infoValue}>
              {item.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Online Payment'}
              {item.paymentReference ? ` · ${item.paymentReference}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>TICKETS</Text>
            <Text style={styles.footerValue}>{item.quantity}</Text>
          </View>
          <View style={styles.footerMid}>
            <Text style={styles.footerLabel}>DISCOUNT</Text>
            <Text style={styles.footerValue}>LKR {item.discountAmount}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerLabel}>TOTAL</Text>
            <Text style={[styles.footerValue, styles.totalText]}>LKR {item.finalAmount}</Text>
          </View>
        </View>

        {paymentSlipSource ? (
          <View style={styles.slipBlock}>
            <Text style={styles.footerLabel}>TRANSFER SLIP</Text>
            <Image source={paymentSlipSource} style={styles.slipImage} />
          </View>
        ) : null}

        {item.paymentStatus === 'pending_verification' ? (
          <View style={styles.reviewRow}>
            <TouchableOpacity
              style={[styles.reviewBtn, styles.rejectBtn, reviewingId === item._id && styles.disabledBtn]}
              onPress={() => handleReview(item, 'reject')}
              disabled={reviewingId === item._id}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reviewBtn, styles.approveBtn, reviewingId === item._id && styles.disabledBtn]}
              onPress={() => handleReview(item, 'approve')}
              disabled={reviewingId === item._id}
            >
              <Text style={styles.approveText}>{reviewingId === item._id ? 'Processing...' : 'Approve Payment'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {item.bookingStatus !== 'cancelled' ? (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.error} style={{ marginRight: 6 }} />
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.pageTitle}>Manage Bookings</Text>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="ticket-outline" title="No bookings found" />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 16 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  bookingId: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, textAlign: 'center', lineHeight: 32, marginRight: 12, borderWidth: 1, borderColor: COLORS.border },
  infoTexts: { flex: 1 },
  infoLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, textTransform: 'uppercase' },
  infoValue: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.bold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerMid: { alignItems: 'center' },
  footerRight: { alignItems: 'flex-end' },
  footerLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 4 },
  footerValue: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold },
  totalText: { color: COLORS.secondary },
  slipBlock: { marginTop: 14 },
  slipImage: { width: '100%', height: 180, borderRadius: SIZES.radiusSm, marginTop: 8 },
  reviewRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  reviewBtn: { flex: 1, paddingVertical: 11, borderRadius: SIZES.radius, alignItems: 'center', borderWidth: 1 },
  approveBtn: { backgroundColor: COLORS.success + '14', borderColor: COLORS.success + '55' },
  rejectBtn: { backgroundColor: COLORS.error + '10', borderColor: COLORS.error + '40' },
  approveText: { color: COLORS.success, ...FONTS.bold, fontSize: SIZES.fontSm },
  rejectText: { color: COLORS.error, ...FONTS.bold, fontSize: SIZES.fontSm },
  disabledBtn: { opacity: 0.5 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.error + '10', borderWidth: 1, borderColor: COLORS.error + '50', alignSelf: 'flex-start' },
  cancelBtnText: { color: COLORS.error, fontSize: SIZES.fontSm, ...FONTS.bold },
});

export default ManageBookings;
