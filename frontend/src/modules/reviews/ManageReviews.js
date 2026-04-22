import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reviewAPI } from '../../services/api';
import { TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../../constants/theme';
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

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.pageTitle}>Review Moderation</Text>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          renderItem={() => null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReviews();
              }}
            />
          }
          ListEmptyComponent={<EmptyState title="No reviews found" />}
        />
      )}
    </ScreenWrapper>
  );
};
;

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
    <View style={[styles.card, SHADOWS.small]}>
      <Text style={styles.eventTitle}>{item.eventId?.title}</Text>
      <Text style={styles.userName}>{item.userId?.fullName}</Text>

      <View style={styles.stars}>{renderStars(item.rating)}</View>

      <Text style={styles.comment}>{item.comment}</Text>

      {reviewImageSource && (
        <Image source={reviewImageSource} style={styles.reviewImage} />
      )}
    </View>
  );
};

