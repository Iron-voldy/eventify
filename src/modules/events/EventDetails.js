import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import StatusBadge from '../../components/StatusBadge';
import ReviewCard from '../../components/ReviewCard';
import SectionHeader from '../../components/SectionHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { eventAPI, reviewAPI } from '../../services/api';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const EventDetails = ({ route, navigation }) => {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, reviewRes] = await Promise.all([
        eventAPI.getOne(id),
        reviewAPI.getEventReviews(id)
      ]);
      setEvent(eventRes.data);
      setReviews(reviewRes.data);
      setAvgRating(reviewRes.avgRating);
    } catch (error) {
      Alert.alert('Error', 'Could not load event details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  if (loading) return <LoadingSpinner />;
  if (!event) return null;

  const imageSource = event.eventImage
    ? { uri: event.eventImage.startsWith('http') ? event.eventImage : `${API_URL}${event.eventImage}` }
    : null;

  const isSoldOut = event.availableSeats === 0;
  const isPast = event.status === 'completed';
  const isCancelled = event.status === 'cancelled';
  const canBook = !isAdmin && !isSoldOut && !isPast && !isCancelled;

  const renderInfoRow = (icon, text, subtext) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.infoTexts}>
        <Text style={styles.infoText}>{text}</Text>
        {subtext && <Text style={styles.infoSubtext}>{subtext}</Text>}
      </View>
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} />
          ) : (
            <View style={[styles.image, { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="images-outline" size={64} color={COLORS.border} />
            </View>
          )}
          <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(10,14,26,1)']} style={styles.gradient} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.category}>{event.category?.toUpperCase()}</Text>
              <Text style={styles.title}>{event.title}</Text>
            </View>
            <StatusBadge status={event.status} size="lg" />
          </View>

          <View style={styles.organizerRow}>
            <View style={styles.organizerAvatar}>
              <Text style={styles.organizerInitial}>{(event.organizerName || 'O')[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.organizerLabel}>Organized by</Text>
              <Text style={styles.organizerName}>{event.organizerName}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            {renderInfoRow(
              'calendar-outline',
              new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
              `${event.startTime} - ${event.endTime}`
            )}
            <View style={styles.infoDivider} />
            {renderInfoRow('location-outline', event.location, 'View map')}
            <View style={styles.infoDivider} />
            {renderInfoRow('ticket-outline', `LKR ${event.ticketPrice} per ticket`, `${event.availableSeats} of ${event.totalSeats} seats available`)}
          </View>

          <SectionHeader title="About Event" />
          <Text style={styles.description}>{event.description}</Text>

          {/* Venue section */}
          {event.venueId && (
            <>
              <SectionHeader title="Venue" />
              <TouchableOpacity
                style={styles.venueCard}
                onPress={() => navigation.navigate('Venues', { venueId: event.venueId._id })}
                activeOpacity={0.8}
              >
                <View style={styles.venueIcon}>
                  <Ionicons name="business" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{event.venueId.name}</Text>
                  <Text style={styles.venueCity}>{event.venueId.city}</Text>
                  <Text style={styles.venueAddress}>{event.venueId.address}</Text>
                  {event.venueId.capacity && (
                    <Text style={styles.venueCapacity}>Capacity: {event.venueId.capacity}</Text>
                  )}
                  {event.venueId.facilities?.length > 0 && (
                    <Text style={styles.venueFacilities}>{event.venueId.facilities.join(' · ')}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </>
          )}

          <SectionHeader
            title="Reviews"
            subtitle={reviews.length > 0 ? `${avgRating} ★ (${reviews.length} reviews)` : 'No reviews yet'}
          />
          {reviews.length > 0 ? (
            reviews.slice(0, 3).map(rev => <ReviewCard key={rev._id} review={rev} />)
          ) : (
            <Text style={styles.noReviews}>Be the first to review after attending this event.</Text>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button for Booking */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>LKR {event.ticketPrice}</Text>
        </View>
        <CustomButton
          title={isAdmin ? "Edit Event" : (isSoldOut ? "Sold Out" : (isCancelled ? "Cancelled" : (isPast ? "Completed" : "Book Ticket")))}
          variant={canBook || isAdmin ? 'primary' : 'outline'}
          disabled={!canBook && !isAdmin}
          onPress={() => isAdmin ? navigation.navigate('CreateEditEvent', { id: event._id }) : navigation.navigate('Checkout', { event })}
          style={{ flex: 1 }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageContainer: { width, height: 320, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.overlayLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  content: { padding: 20, marginTop: -40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  category: { color: COLORS.secondary, fontSize: SIZES.fontSm, ...FONTS.bold, letterSpacing: 1, marginBottom: 8 },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXxxl, ...FONTS.bold, lineHeight: 40 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  organizerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.border },
  organizerInitial: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  organizerLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 2 },
  organizerName: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold },
  infoCard: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusLg, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: COLORS.glassBorder },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoTexts: { flex: 1 },
  infoText: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 4 },
  infoSubtext: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  infoDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  description: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.regular, lineHeight: 24, marginBottom: 32 },
  noReviews: { color: COLORS.textMuted, fontSize: SIZES.fontBase, fontStyle: 'italic', marginBottom: 20 },
  venueCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: COLORS.border },
  venueIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  venueInfo: { flex: 1 },
  venueName: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 2 },
  venueCity: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 2 },
  venueAddress: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.regular, marginBottom: 2 },
  venueCapacity: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 2 },
  venueFacilities: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.regular },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, flexDirection: 'row', padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  priceContainer: { marginRight: 24 },
  priceLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 4 },
  priceValue: { color: COLORS.secondary, fontSize: SIZES.fontXxl, ...FONTS.bold },
});

export default EventDetails;
