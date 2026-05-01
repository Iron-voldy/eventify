import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { API_URL } from '../constants/api';

const ReviewCard = ({ review }) => {
  const reviewImageSource = review.reviewImage
    ? { uri: review.reviewImage.startsWith('http') ? review.reviewImage : `${API_URL}${review.reviewImage}` }
    : null;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color={i < rating ? COLORS.warning : COLORS.textMuted}
      />
    ));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(review.userId?.fullName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{review.userId?.fullName || 'Anonymous'}</Text>
          <Text style={styles.date}>
            {new Date(review.reviewDate || review.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.stars}>{renderStars(review.rating)}</View>
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
      {reviewImageSource ? (
        <Image source={reviewImageSource} style={styles.reviewImage} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#FFF', ...FONTS.bold, fontSize: SIZES.fontBase },
  headerInfo: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.semibold },
  date: { color: COLORS.textMuted, fontSize: SIZES.fontXs },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.regular, lineHeight: 20 },
  reviewImage: { width: '100%', height: 190, borderRadius: SIZES.radiusSm, marginTop: 12 },
});

export default ReviewCard;
