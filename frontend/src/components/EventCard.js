import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_URL } from '../constants/api';

const AVATAR_COLORS = ['#7C3AED', '#EC4899', '#06B6D4'];

const EventCard = ({ event, onPress, onWishlistToggle, isWishlisted = false }) => {
  const imageSource = event.eventImage
    ? { uri: event.eventImage.startsWith('http') ? event.eventImage : `${API_URL}${event.eventImage}` }
    : null;

  const eventDate = new Date(event.eventDate);
  const month = eventDate.toLocaleDateString('en', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();
  const bookedCount = Math.max(0, (event.totalSeats || 0) - (event.availableSeats || 0));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.card}>
      {/* Background image */}
      {imageSource ? (
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.image}
        />
      )}

      {/* Dark gradient scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.88)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Date badge – top left */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateMon}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>

      {/* Category badge – top right + wishlist heart */}
      <View style={styles.topRight}>
        {event.category ? (
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{event.category.toUpperCase()}</Text>
          </View>
        ) : null}
        {onWishlistToggle ? (
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => { e.stopPropagation?.(); onWishlistToggle(event._id); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name={isWishlisted ? 'favorite' : 'favorite-border'}
              size={20}
              color={isWishlisted ? '#EF4444' : 'rgba(255,255,255,0.85)'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Bottom info overlay */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
        </View>

        <View style={styles.bottomRow}>
          {/* Stacked attendee avatars */}
          <View style={styles.avatarStack}>
            {AVATAR_COLORS.map((color, i) => (
              <View key={i} style={[styles.avatar, { backgroundColor: color, marginLeft: i === 0 ? 0 : -10 }]} />
            ))}
            {bookedCount > 0 && (
              <Text style={styles.attendeeCount}>+{bookedCount > 99 ? '99' : bookedCount}</Text>
            )}
          </View>

          {/* Price + Get Now */}
          <TouchableOpacity style={styles.getBtn} onPress={onPress}>
            <Text style={styles.getBtnPrice}>LKR {event.ticketPrice}</Text>
            <Text style={styles.getBtnLabel}> · Get Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 265,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  dateBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 48,
  },
  dateMon: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dateDay: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  catBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.6)',
  },
  topRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  catText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 3,
  },
  location: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  attendeeCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  getBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  getBtnPrice: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  getBtnLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EventCard;
