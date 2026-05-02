import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reviewAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await reviewAPI.getAll();
      setReviews(res.data);
    } catch (error) {
      console.log('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [])
  );

  const toggleVisibility = async (id, currentStatus) => {
    const willHide = currentStatus === 'visible';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${willHide ? 'hide' : 'show'} this review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willHide ? 'Hide' : 'Show',
          style: 'default',
          onPress: async () => {
            try {
              await reviewAPI.toggle(id);
              setReviews(reviews.map(r =>
                r._id === id ? { ...r, status: willHide ? 'hidden' : 'visible' } : r
              ));
            } catch (error) {
              Alert.alert('Error', 'Could not update review status');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Review', 'Are you sure you want to permanently delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewAPI.delete(id);
            setReviews(reviews.filter(r => r._id !== id));
          } catch (error) {
            Alert.alert('Error', 'Could not delete review');
          }
        },
      },
    ]);
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons key={i} name={i < rating ? 'star' : 'star-outline'} size={14} color={COLORS.warning} />
    ));

  const renderItem = ({ item }) => {
    const isVisible = item.status === 'visible';
    const reviewImageSource = item.reviewImage
      ? { uri: item.reviewImage.startsWith('http') ? item.reviewImage : `${API_URL}${item.reviewImage}` }
      : null;

    return (
      <View style={[styles.card, SHADOWS.small, !isVisible && styles.hiddenCard]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.eventId?.title || 'Unknown Event'}</Text>
            <Text style={styles.userName}>by {item.userId?.fullName || 'Unknown User'} · {item.userId?.email || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isVisible ? COLORS.success + '20' : COLORS.textMuted + '20' }]}>
            <Text style={[styles.statusText, { color: isVisible ? COLORS.success : COLORS.textMuted }]}>
              {isVisible ? 'VISIBLE' : 'HIDDEN'}
            </Text>
          </View>
        </View>

        <View style={styles.stars}>{renderStars(item.rating)}</View>
        <Text style={styles.comment}>{item.comment}</Text>
        {reviewImageSource ? (
          <Image source={reviewImageSource} style={styles.reviewImage} />
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.date}>{new Date(item.reviewDate).toLocaleDateString()}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: isVisible ? COLORS.warning + '80' : COLORS.success + '80' }]}
              onPress={() => toggleVisibility(item._id, item.status)}
            >
              <Ionicons
                name={isVisible ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={isVisible ? COLORS.warning : COLORS.success}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.actionBtnText, { color: isVisible ? COLORS.warning : COLORS.success }]}>
                {isVisible ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: COLORS.error + '80' }]}
              onPress={() => handleDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} style={{ marginRight: 4 }} />
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.pageTitle}>Review Moderation</Text>
      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="star-half-outline" title="No reviews found" />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 16 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  hiddenCard: { opacity: 0.6, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  eventTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 2 },
  userName: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: SIZES.radiusSm },
  statusText: { fontSize: SIZES.fontXs, ...FONTS.bold },
  stars: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  comment: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, lineHeight: 20, marginBottom: 16 },
  reviewImage: { width: '100%', height: 180, borderRadius: SIZES.radiusSm, marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  date: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1 },
  actionBtnText: { fontSize: SIZES.fontXs, ...FONTS.bold },
});

export default ManageReviews;
