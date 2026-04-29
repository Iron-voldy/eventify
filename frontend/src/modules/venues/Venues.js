import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomInput from '../../components/CustomInput';
import EventCard from '../../components/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { venueAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const Venues = ({ navigation, route }) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // When a venue is selected — show its events
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueEvents, setVenueEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const initialVenueId = route?.params?.venueId;

  const fetchVenues = async (q = search) => {
    try {
      const params = q ? { search: q } : {};
      const res = await venueAPI.getAll(params);
      const venueList = res.data || [];
      setVenues(venueList);

      if (initialVenueId) {
        const matchedVenue = venueList.find((venue) => venue._id === initialVenueId);
        if (matchedVenue) {
          handleSelectVenue(matchedVenue);
        }
      }
    } catch (error) {
      console.log('Error fetching venues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchVenues(); }, [initialVenueId]));

  const handleSelectVenue = async (venue) => {
    setSelectedVenue(venue);
    setEventsLoading(true);
    try {
      const res = await venueAPI.getVenueEvents(venue._id);
      setVenueEvents(res.data);
    } catch (error) {
      setVenueEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleBack = () => {
    if (initialVenueId && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    setSelectedVenue(null);
    setVenueEvents([]);
    if (route?.params?.venueId) {
      navigation.setParams({ venueId: undefined });
    }
  };

  const selectedVenueImage = selectedVenue?.venueImage
    ? { uri: selectedVenue.venueImage.startsWith('http') ? selectedVenue.venueImage : `${API_URL}${selectedVenue.venueImage}` }
    : null;

  const renderVenueItem = ({ item }) => {
    const venueImageSource = item.venueImage
      ? { uri: item.venueImage.startsWith('http') ? item.venueImage : `${API_URL}${item.venueImage}` }
      : null;

    return (
      <TouchableOpacity
        style={[styles.venueCard, SHADOWS.small]}
        onPress={() => handleSelectVenue(item)}
        activeOpacity={0.8}
      >
        {venueImageSource ? (
          <Image source={venueImageSource} style={styles.venueBgImage} />
        ) : (
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary, COLORS.secondary]}
            style={styles.venueBgImage}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.venueCardTop}>
          <View style={styles.capacityBadge}>
            <Ionicons name="people-outline" size={12} color="#FFF" />
            <Text style={styles.capacityText}>{item.capacity}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
        </View>

        <View style={styles.venueCardBottom}>
          <View style={styles.venueBadge}>
            <Ionicons name="location-outline" size={14} color="#FFF" />
            <Text style={styles.venueBadgeText}>{item.city}</Text>
          </View>
          <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.venueAddress} numberOfLines={2}>{item.address}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Venue detail view ──────────────────────────────────────────
  if (selectedVenue) {
    return (
      <ScreenWrapper scroll={false} padded={false}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1}>{selectedVenue.name}</Text>
        </View>

        <FlatList
          data={eventsLoading ? [] : venueEvents}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailListContent}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetails', { id: item._id })}
            />
          )}
          ListHeaderComponent={(
            <View style={styles.detailIntro}>
              <View style={[styles.venueHero, SHADOWS.small]}>
                {selectedVenueImage ? (
                  <Image source={selectedVenueImage} style={styles.venueHeroImage} />
                ) : (
                  <LinearGradient colors={[COLORS.primaryDark, COLORS.primary, COLORS.secondary]} style={styles.venueHeroImage} />
                )}
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)', 'rgba(7,0,15,0.94)']}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.venueHeroContent}>
                  <View style={styles.heroPills}>
                    <View style={styles.heroPill}>
                      <Ionicons name="people-outline" size={14} color="#FFF" />
                      <Text style={styles.heroPillText}>Capacity {selectedVenue.capacity}</Text>
                    </View>
                    {selectedVenue.contactPhone ? (
                      <View style={styles.heroPill}>
                        <Ionicons name="call-outline" size={14} color="#FFF" />
                        <Text style={styles.heroPillText}>{selectedVenue.contactPhone}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.venueInfoName}>{selectedVenue.name}</Text>
                  <Text style={styles.venueInfoCity}>{selectedVenue.city}</Text>
                  <Text style={styles.venueInfoAddress}>{selectedVenue.address}</Text>
                </View>
              </View>

              {selectedVenue.facilities?.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facilitiesScroll} contentContainerStyle={styles.facilitiesScrollContent}>
                  {selectedVenue.facilities.map(f => (
                    <View key={f} style={styles.facilityTag}>
                      <Ionicons name="checkmark" size={12} color={COLORS.success} />
                      <Text style={styles.facilityTagText}>{f}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={styles.infoPanel}>
                {selectedVenue.description ? (
                  <>
                    <Text style={styles.panelTitle}>About This Place</Text>
                    <Text style={styles.panelText}>{selectedVenue.description}</Text>
                  </>
                ) : null}

                {selectedVenue.contactEmail ? (
                  <>
                    <Text style={styles.panelTitle}>Contact Email</Text>
                    <Text style={styles.panelText}>{selectedVenue.contactEmail}</Text>
                  </>
                ) : null}
              </View>

              <Text style={styles.eventsHeader}>Events at this Venue</Text>
            </View>
          )}
          ListEmptyComponent={
            eventsLoading
              ? <LoadingSpinner fullScreen={false} />
              : <EmptyState icon="calendar-outline" title="No events at this venue" subtitle="Check back later for upcoming events" />
          }
        />
      </ScreenWrapper>
    );
  }

  // ── Venues list view ──────────────────────────────────────────
  return (
    <ScreenWrapper scroll={false}>
      {navigation.canGoBack() && (
        <View style={styles.listHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.pageTitle}>Venues</Text>
      <Text style={styles.pageSubtitle}>Browse events by venue</Text>

      <CustomInput
        placeholder="Search venues, cities..."
        value={search}
        onChangeText={t => { setSearch(t); fetchVenues(t); }}
        icon={<Ionicons name="search" size={20} color={COLORS.textMuted} />}
        style={styles.searchInput}
      />

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={venues}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVenues(); }} tintColor={COLORS.primary} />}
          renderItem={renderVenueItem}
          ListEmptyComponent={<EmptyState icon="business-outline" title="No venues found" subtitle="Try a different search" />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listHeader: { marginTop: 16, marginBottom: 8 },
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 4 },
  pageSubtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.regular, marginBottom: 16 },
  searchInput: { marginBottom: 16 },
  list: { paddingBottom: 20 },
  venueCard: { height: 210, borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: 16, marginHorizontal: 2, backgroundColor: COLORS.surfaceLight },
  venueBgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  venueCardTop: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  capacityText: { color: '#FFF', fontSize: SIZES.fontXs, ...FONTS.bold },
  venueCardBottom: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  venueBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(124,58,237,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusFull, marginBottom: 10 },
  venueBadgeText: { color: '#FFF', fontSize: SIZES.fontXs, ...FONTS.bold },
  venueName: { color: '#FFF', fontSize: SIZES.fontXl, ...FONTS.bold, marginBottom: 4 },
  venueAddress: { color: 'rgba(255,255,255,0.84)', fontSize: SIZES.fontSm, ...FONTS.medium, lineHeight: 20 },

  // Detail view
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12, gap: 12, paddingHorizontal: 16 },
  detailListContent: { paddingBottom: 24 },
  detailIntro: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  venueHero: { height: 280, borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: 16, backgroundColor: COLORS.surfaceLight },
  venueHeroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  venueHeroContent: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroPillText: { color: '#FFF', fontSize: SIZES.fontXs, ...FONTS.bold },
  venueInfoName: { color: '#FFF', fontSize: SIZES.fontXxxl, ...FONTS.bold, marginBottom: 6 },
  venueInfoCity: { color: COLORS.secondary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 6 },
  venueInfoAddress: { color: 'rgba(255,255,255,0.84)', fontSize: SIZES.fontSm, ...FONTS.medium, lineHeight: 20 },
  facilitiesScroll: { maxHeight: 42, marginBottom: 14 },
  facilitiesScrollContent: { paddingRight: 12 },
  facilityTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: SIZES.radiusFull, marginRight: 8 },
  facilityTagText: { color: COLORS.success, fontSize: SIZES.fontXs, ...FONTS.medium },
  infoPanel: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  panelTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 6 },
  panelText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.regular, lineHeight: 20, marginBottom: 14 },
  eventsHeader: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: 12, marginTop: 4 },
});

export default Venues;
