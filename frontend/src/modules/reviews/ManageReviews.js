import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reviewAPI } from '../../services/api';

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