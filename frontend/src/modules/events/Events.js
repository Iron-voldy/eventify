import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import EventCard from '../../components/EventCard';
import CustomInput from '../../components/CustomInput';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { eventAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['All', 'Technology', 'Music', 'Business', 'Networking', 'Health', 'Education', 'Workshop', 'Conference'];

const Events = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchEvents = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (activeCategory !== 'All') params.category = activeCategory.toLowerCase();

      const res = await eventAPI.getAll(params);
      setEvents(res.data);
    } catch (error) {
      console.log('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [search, activeCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Explore Events</Text>
      <CustomInput
        placeholder="Search events, locations..."
        value={search}
        onChangeText={setSearch}
        icon={<Ionicons name="search" size={20} color={COLORS.textMuted} />}
        style={styles.search}
      />
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.categoryPill, activeCategory === cat && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <ScreenWrapper scroll={false}>
      {renderHeader()}
      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetails', { id: item._id })}
            />
          )}
          ListEmptyComponent={<EmptyState icon="search-outline" title="No events found matching your criteria" />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { marginTop: 16, marginBottom: 8 },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginBottom: 16 },
  search: { marginBottom: 16 },
  categoryContainer: { height: 40, marginBottom: 12 },
  categoryScroll: { gap: 10 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  categoryActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  categoryTextActive: { color: '#FFF', ...FONTS.bold },
  listContent: { paddingBottom: 20 },
});

export default Events;
