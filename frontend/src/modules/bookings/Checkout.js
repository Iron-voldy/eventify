import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import SeatSelector from '../../components/SeatSelector';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI, promoAPI, eventAPI, paymentAPI } from '../../services/api';

const PAYMENT_METHODS = [
  { key: 'online', label: 'PayHere (Online)', icon: 'card-outline' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'receipt-outline' },
];

const Checkout = ({ route, navigation }) => {
  const { event } = route.params;

  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentSlipImage, setPaymentSlipImage] = useState(null);

  // Seat allocation state
  const [seatInfo, setSeatInfo] = useState(null);
  const [seatInfoLoading, setSeatInfoLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const isManualSeats = seatInfo?.seatAllocationMode === 'manual';

  const subtotal = event.ticketPrice * quantity;
  const discount = promoData ? promoData.discountAmount : 0;
  const total = subtotal - discount;

  // Load seat data for manual-allocation events
  useEffect(() => {
    const load = async () => {
      try {
        setSeatInfoLoading(true);
        const res = await eventAPI.getSeats(event._id);
        setSeatInfo(res.data);
      } catch (_) {
        // Seat info load failure is non-fatal; treat as auto mode
      } finally {
        setSeatInfoLoading(false);
      }
    };
    load();
  }, [event._id]);

  const resetPromo = () => { setPromoData(null); setPromoCode(''); };

  const increaseQuantity = () => {
    if (quantity < event.availableSeats) {
      setQuantity(q => q + 1);
      resetPromo();
      setSelectedSeats([]);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
      resetPromo();
      setSelectedSeats([]);
    }
  };

  const toggleSeat = (seatNum) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNum)) return prev.filter(s => s !== seatNum);
      if (prev.length >= quantity) return prev;
      return [...prev, seatNum];
    });
  };

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setLoadingCode(true);
      const res = await promoAPI.validate({ code: promoCode, amount: subtotal });
      setPromoData(res.data);
      Alert.alert('Success', `Promo applied! You saved LKR ${res.data.discountAmount}`);
    } catch (error) {
      setPromoData(null);
      Alert.alert('Invalid Code', error.message || 'The promo code is invalid or expired.');
    } finally {
      setLoadingCode(false);
    }
  };

  const pickPaymentSlip = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow media access to upload your transfer slip.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPaymentSlipImage(result.assets[0]);
  };

  const validateSeats = () => {
    if (!isManualSeats) return true;
    if (selectedSeats.length !== quantity) {
      Alert.alert('Select Seats', `Please select exactly ${quantity} seat${quantity > 1 ? 's' : ''} before proceeding.`);
      return false;
    }
    return true;
  };

  // Online payment via PayHere
  const handleOnlinePayment = async () => {
    if (!validateSeats()) return;
    try {
      setBookingLoading(true);
      const payload = {
        eventId: event._id,
        quantity: String(quantity),
        ...(promoData?.code && { promoCode: promoData.code }),
        ...(isManualSeats && { seatNumbers: JSON.stringify(selectedSeats) }),
      };
      const res = await paymentAPI.initiate(payload);
      navigation.navigate('PayHereCheckout', {
        bookingId: res.data.bookingId,
      });
    } catch (error) {
      Alert.alert('Payment Error', error.message || 'Could not initiate PayHere payment.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Bank transfer booking
  const handleBankTransfer = async () => {
    if (!validateSeats()) return;
    if (!paymentSlipImage) {
      Alert.alert('Slip Required', 'Upload the bank transfer slip so the admin can verify your payment.');
      return;
    }
    try {
      setBookingLoading(true);
      const formData = new FormData();
      formData.append('eventId', event._id);
      formData.append('quantity', String(quantity));
      formData.append('paymentMethod', 'bank_transfer');
      if (promoData?.code) formData.append('promoCode', promoData.code);
      if (paymentReference.trim()) formData.append('paymentReference', paymentReference.trim());
      if (isManualSeats && selectedSeats.length > 0) {
        formData.append('seatNumbers', JSON.stringify(selectedSeats));
      }
      formData.append('paymentSlipImage', {
        uri: paymentSlipImage.uri,
        name: paymentSlipImage.fileName || 'payment-slip.jpg',
        type: paymentSlipImage.mimeType || 'image/jpeg',
      });
      await bookingAPI.create(formData);
      Alert.alert(
        'Transfer Submitted',
        'Your booking is pending until the admin verifies the bank transfer slip.',
        [{ text: 'View Bookings', onPress: () => navigation.replace('UserRoot', { screen: 'Bookings' }) }]
      );
    } catch (error) {
      Alert.alert('Booking Failed', error.message || 'Could not complete booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBook = () => {
    if (quantity < 1 || quantity > event.availableSeats) {
      Alert.alert('Error', 'Invalid quantity selected');
      return;
    }
    if (paymentMethod === 'online') handleOnlinePayment();
    else handleBankTransfer();
  };

  if (seatInfoLoading) return <LoadingSpinner />;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Event Summary */}
        <Text style={styles.sectionTitle}>Event Summary</Text>
        <View style={[styles.card, SHADOWS.small]}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={14} /> {new Date(event.eventDate).toLocaleDateString()}
          </Text>
          <Text style={styles.eventMeta}>
            <Ionicons name="location-outline" size={14} /> {event.location}
          </Text>
        </View>

        {/* Tickets */}
        <Text style={styles.sectionTitle}>Tickets</Text>
        <View style={[styles.card, styles.row, SHADOWS.small]}>
          <View>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.pricePerTicket}>LKR {event.ticketPrice} per ticket</Text>
          </View>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              onPress={decreaseQuantity}
              style={styles.qtyBtn}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={20} color={quantity <= 1 ? COLORS.textMuted : COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              onPress={increaseQuantity}
              style={styles.qtyBtn}
              disabled={quantity >= event.availableSeats}
            >
              <Ionicons name="add" size={20} color={quantity >= event.availableSeats ? COLORS.textMuted : COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seat Selection (manual mode only) */}
        {isManualSeats && seatInfo && (
          <>
            <Text style={styles.sectionTitle}>Select Seats</Text>
            <View style={[styles.card, SHADOWS.small]}>
              <Text style={styles.seatHint}>
                Select {quantity} seat{quantity > 1 ? 's' : ''} from the map below.
              </Text>
              <SeatSelector
                totalSeats={seatInfo.totalSeats}
                blockedSeats={seatInfo.blockedSeats}
                bookedSeats={seatInfo.bookedSeats}
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
                maxSelectable={quantity}
              />
              {selectedSeats.length > 0 && (
                <Text style={styles.selectedSeatsText}>
                  Selected: {selectedSeats.sort((a, b) => a - b).join(', ')}
                </Text>
              )}
            </View>
          </>
        )}

        {/* Auto allocation note */}
        {!isManualSeats && seatInfo && (
          <>
            <Text style={styles.sectionTitle}>Seat Allocation</Text>
            <View style={[styles.card, SHADOWS.small, styles.autoAllocCard]}>
              <Ionicons name="shuffle-outline" size={22} color={COLORS.primary} />
              <Text style={styles.autoAllocText}>
                Seats are automatically assigned in order. Your seat numbers will appear on your booking confirmation.
              </Text>
            </View>
          </>
        )}

        {/* Promo Code */}
        <Text style={styles.sectionTitle}>Promo Code</Text>
        <View style={[styles.card, SHADOWS.small]}>
          <View style={styles.promoRow}>
            <CustomInput
              placeholder="Enter code (e.g., WELCOME15)"
              value={promoCode}
              onChangeText={setPromoCode}
              style={{ flex: 1, marginBottom: 0, marginRight: 12 }}
              editable={!promoData}
            />
            {!promoData ? (
              <CustomButton title="Apply" onPress={applyPromo} loading={loadingCode} size="sm" />
            ) : (
              <TouchableOpacity onPress={resetPromo} style={styles.removePromo}>
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          {promoData && <Text style={styles.promoSuccess}>{promoData.description}</Text>}
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={[styles.card, SHADOWS.small]}>
          <View style={styles.paymentMethodGrid}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.paymentMethodCard,
                  paymentMethod === method.key && styles.paymentMethodCardActive,
                ]}
                onPress={() => setPaymentMethod(method.key)}
              >
                <Ionicons
                  name={method.icon}
                  size={22}
                  color={paymentMethod === method.key ? '#FFF' : COLORS.primary}
                />
                <Text
                  style={[
                    styles.paymentMethodLabel,
                    paymentMethod === method.key && styles.paymentMethodLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === 'online' ? (
            <View style={styles.paymentFields}>
              <View style={styles.payhereInfo}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
                <Text style={styles.payhereInfoText}>
                  You will be redirected to PayHere secure payment gateway. Visa, Mastercard, and other cards accepted.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.paymentFields}>
              <CustomInput
                label="Transfer Reference (Optional)"
                placeholder="Bank reference number"
                value={paymentReference}
                onChangeText={setPaymentReference}
                autoCapitalize="characters"
              />
              <Text style={styles.helperText}>
                Upload the slip after making the transfer. The booking will stay pending until an admin verifies it.
              </Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickPaymentSlip}>
                <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
                <Text style={styles.uploadBtnText}>
                  {paymentSlipImage ? 'Change Transfer Slip' : 'Upload Transfer Slip *'}
                </Text>
              </TouchableOpacity>
              {paymentSlipImage?.uri ? (
                <Image source={{ uri: paymentSlipImage.uri }} style={styles.slipPreview} />
              ) : null}
            </View>
          )}
        </View>

        {/* Payment Summary */}
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={[styles.card, SHADOWS.small, styles.summaryCard]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({quantity} ticket{quantity > 1 ? 's' : ''})</Text>
            <Text style={styles.summaryValue}>LKR {subtotal}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelDiscount}>Discount</Text>
              <Text style={styles.summaryValueDiscount}>- LKR {discount}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>LKR {total}</Text>
          </View>
        </View>

        <CustomButton
          title={
            paymentMethod === 'online'
              ? `Pay LKR ${total} via PayHere`
              : 'Submit Transfer For Review'
          }
          onPress={handleBook}
          loading={bookingLoading}
          style={styles.payBtn}
          icon={
            <Ionicons
              name={paymentMethod === 'online' ? 'card' : 'receipt'}
              size={20}
              color="#FFF"
            />
          }
        />
        <Text style={styles.secureText}>
          <Ionicons name="lock-closed" size={12} />{' '}
          {paymentMethod === 'online'
            ? 'Powered by PayHere — secure payment gateway'
            : 'Secure payment proof verification by admin'}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontLg,
    ...FONTS.bold,
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  eventTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: 8 },
  eventMeta: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 4 },
  pricePerTicket: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusFull,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, width: 40, textAlign: 'center' },
  seatHint: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 14 },
  selectedSeatsText: {
    color: COLORS.success,
    fontSize: SIZES.fontSm,
    ...FONTS.bold,
    marginTop: 12,
    textAlign: 'center',
  },
  autoAllocCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  autoAllocText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, lineHeight: 20 },
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  removePromo: { padding: 8 },
  promoSuccess: { color: COLORS.success, fontSize: SIZES.fontSm, ...FONTS.medium, marginTop: 8 },
  paymentMethodGrid: { flexDirection: 'row', gap: 12 },
  paymentMethodCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentMethodLabel: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.bold, textAlign: 'center' },
  paymentMethodLabelActive: { color: '#FFF' },
  paymentFields: { marginTop: 16 },
  payhereInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.success + '12',
    borderRadius: SIZES.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  payhereInfoText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, lineHeight: 20 },
  helperText: { color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium, lineHeight: 20, marginTop: 4 },
  uploadBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },
  uploadBtnText: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.bold },
  slipPreview: { width: '100%', height: 180, borderRadius: SIZES.radius, marginTop: 12 },
  summaryCard: { padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium },
  summaryValue: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold },
  summaryLabelDiscount: { color: COLORS.successLight, fontSize: SIZES.fontBase, ...FONTS.medium },
  summaryValueDiscount: { color: COLORS.successLight, fontSize: SIZES.fontBase, ...FONTS.bold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  totalLabel: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  totalValue: { color: COLORS.secondary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  payBtn: { marginTop: 32, marginBottom: 16, height: 56 },
  secureText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: SIZES.fontXs,
    ...FONTS.medium,
    marginBottom: 30,
  },
});

export default Checkout;
