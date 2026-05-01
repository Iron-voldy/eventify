import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, StatusBar, SafeAreaView, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants/theme';
import EventCard from '../../components/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { eventAPI, wishlistAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const HERO_IMAGE = require('../../../assets/r_1.jpg');

const CATEGORY_GRID = [
  { id: 'music',      label: 'Music',     icon: 'music-note'      },
  { id: 'technology', label: 'Tech',      icon: 'computer'        },
  { id: 'business',   label: 'Business',  icon: 'business-center' },
  { id: 'education',  label: 'Education', icon: 'school'          },
  { id: 'health',     label: 'Wellness',  icon: 'spa'             },
  { id: 'networking', label: 'Network',   icon: 'people'          },
  { id: 'workshop',   label: 'Workshop',  icon: 'build'           },
  { id: 'all',        label: 'More',      icon: 'apps'            },
];

const Home = ({ navigation }) => {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const fetchEvents = useCallback(async () => {
    try {
      const params = { status: 'upcoming' };
      if (activeCategory !== 'all') params.category = activeCategory;
      const res = await eventAPI.getAll(params);
      setEvents(res.data);
    } catch (err) {
      console.log('Error fetching events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  useFocusEffect(useCallback(() => {
    wishlistAPI.get().then(res => {
      setWishlistIds(new Set(res.data.map(e => e._id)));
    }).catch(() => {});
  }, []));

  const handleWishlistToggle = async (eventId) => {
    try {
      const res = await wishlistAPI.toggle(eventId);
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (res.added) next.add(eventId); else next.delete(eventId);
        return next;
      });
    } catch (e) { console.log(e); }
  };

  const avatarUri = user?.profileImage
    ? (user.profileImage.startsWith('http') ? user.profileImage : `${API_URL}${user.profileImage}`)
    : null;

  const ListHeader = () => (
    <View>
      {/* Hero section */}
      <View style={styles.heroContainer}>
        <Image source={HERO_IMAGE} style={styles.heroBg} blurRadius={14} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(7,0,15,0.45)', 'rgba(7,0,15,0.65)', 'rgba(7,0,15,0.88)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.logoCircle}>
              <Text style={styles.logoLetter}>E</Text>
            </LinearGradient>
            <Text style={styles.logoText}>Eventify</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialIcons name="notifications-none" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(user?.fullName || 'U')[0].toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Wishlist')}>
              <MaterialIcons name="favorite-border" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero text */}
        <View style={styles.heroText}>
          <Text style={styles.heroWhite}>Your Event.</Text>
          <Text style={styles.heroAccent}>Instantly Discovered.</Text>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('ExploreEvents')} activeOpacity={0.88}>
        <View style={styles.searchIconCircle}>
          <MaterialIcons name="search" size={21} color="#FFF" />
        </View>
        <Text style={styles.searchPlaceholder}>Find Your Event</Text>
        <View style={styles.filterBtn}>
          <MaterialIcons name="tune" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>

      {/* Quick action pills */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickPill} onPress={() => navigation.navigate('ExploreEvents')} activeOpacity={0.8}>
          <MaterialIcons name="event" size={16} color={COLORS.primary} />
          <Text style={styles.quickText}>Upcoming Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickPill} onPress={() => navigation.navigate('Places')} activeOpacity={0.8}>
          <MaterialIcons name="place" size={16} color={COLORS.secondary} />
          <Text style={[styles.quickText, { color: COLORS.secondary }]}>Places</Text>
        </TouchableOpacity>
      </View>

      {/* Explore header */}
      <View style={styles.exploreHeader}>
        <Text style={styles.exploreTitle}>Explore</Text>
        <Text style={styles.exploreSubtitle}>Pick a category to start planning</Text>
      </View>

      {/* Category Grid */}
      <View style={styles.categoryGrid}>
        {CATEGORY_GRID.map(cat => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => { setActiveCategory(cat.id); setLoading(true); }}
              style={styles.catGridItem}
              activeOpacity={0.8}
            >
              <View style={[styles.catCircle, active && styles.catCircleActive]}>
                <MaterialIcons name={cat.icon} size={22} color={active ? '#FFF' : COLORS.textSecondary} />
              </View>
              <Text style={[styles.catGridLabel, active && styles.catGridLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section header */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExploreEvents')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {loading ? (
        <View style={{ flex: 1 }}>
          <ListHeader />
          <LoadingSpinner fullScreen={false} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetails', { id: item._id })}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={wishlistIds.has(item._id)}
            />
          )}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No events found"
              subtitle="Try a different category or check back later"
            />
          }
          ListFooterComponent={<View style={{ height: 32 }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchEvents(); }}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingBottom: 16 },

  /* Hero */
  heroContainer: { overflow: 'hidden', paddingBottom: 32, marginBottom: -10 },
  heroBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },

  /* Header inside hero */
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#FFF', fontSize: 19, fontWeight: '900', fontStyle: 'italic' },
  logoText: { color: '#FFF', fontSize: SIZES.fontLg, fontWeight: '800', letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: SIZES.fontBase, fontWeight: '700' },

  /* Hero text */
  heroText: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },
  heroWhite: { color: '#FFFFFF', fontSize: SIZES.fontHero, fontWeight: '800', lineHeight: 50, letterSpacing: -1 },
  heroAccent: { color: COLORS.secondary, fontSize: SIZES.fontXxxl, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 },

  /* Search */
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 4, marginBottom: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: SIZES.radiusMd, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 14 },
  searchIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  searchPlaceholder: { flex: 1, color: '#9CA3AF', fontSize: SIZES.fontBase, fontWeight: '600' },
  filterBtn: { width: 40, height: 40, borderRadius: SIZES.radiusSm, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

  /* Quick pills */
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 },
  quickPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 12, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, gap: 7 },
  quickText: { fontSize: SIZES.fontBase, fontWeight: '700', color: COLORS.primary },

  /* Explore */
  exploreHeader: { paddingHorizontal: 20, marginBottom: 18 },
  exploreTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, fontWeight: '800', marginBottom: 3 },
  exploreSubtitle: { color: COLORS.textMuted, fontSize: SIZES.fontSm, fontWeight: '400' },

  /* Category Grid */
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 28 },
  catGridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  catCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  catCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catGridLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  catGridLabelActive: { color: COLORS.primary, fontWeight: '700' },

  /* Section header */
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, fontWeight: '700' },
  seeAll: { fontSize: SIZES.fontBase, fontWeight: '600', color: COLORS.primary },
});

export default Home;
