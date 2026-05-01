import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardAPI } from '../../services/api';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, SHADOWS.small]} onPress={onPress}>
    <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const Dashboard = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.log('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !stats) return <LoadingSpinner />;

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Overview</Text>
        <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.content}
      >
        {/* Revenue Card Summary */}
        <View style={[styles.revenueCard, SHADOWS.medium]}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>LKR {(stats?.totalRevenue || 0).toLocaleString()}</Text>
          <View style={styles.revenueFooter}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueDate}>Confirmed Bookings</Text>
              <Text style={styles.revenueSub}>{stats?.confirmedBookings || 0}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <Text style={styles.revenueDate}>Total Bookings</Text>
              <Text style={styles.revenueSub}>{stats?.totalBookings || 0}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Stats</Text>
        
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="people"
            color={COLORS.primary}
            onPress={() => navigation.navigate('Users')}
          />
          <StatCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            icon="calendar"
            color={COLORS.secondary}
            onPress={() => navigation.navigate('Events')}
          />
          <StatCard
            title="Total Reviews"
            value={stats?.totalReviews || 0}
            icon="star-half"
            color={COLORS.warning}
            onPress={() => navigation.navigate('ManageReviews')}
          />
          <StatCard
            title="Open Tickets"
            value={stats?.openComplaints || 0}
            icon="warning"
            color={COLORS.error}
            onPress={() => navigation.navigate('ManageComplaints')}
          />
        </View>

        {/* Action Menu */}
        <Text style={styles.sectionTitle}>Management Console</Text>
        <View style={styles.actionMenu}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Users')}>
            <View style={styles.actionIcon}><Ionicons name="people-outline" size={24} color={COLORS.textPrimary} /></View>
            <Text style={styles.actionText}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Events')}>
            <View style={styles.actionIcon}><Ionicons name="calendar-outline" size={24} color={COLORS.textPrimary} /></View>
            <Text style={styles.actionText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ManageBookings')}>
            <View style={styles.actionIcon}><Ionicons name="ticket-outline" size={24} color={COLORS.textPrimary} /></View>
            <Text style={styles.actionText}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ManagePromos')}>
            <View style={styles.actionIcon}><Ionicons name="pricetag-outline" size={24} color={COLORS.textPrimary} /></View>
            <Text style={styles.actionText}>Promos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gap} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  headerTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  content: { paddingBottom: 40 },
  revenueCard: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 24, marginBottom: 24 },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 8 },
  revenueValue: { color: '#FFF', fontSize: 36, ...FONTS.bold, marginBottom: 24 },
  revenueFooter: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: SIZES.radiusMd, padding: 16 },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueDate: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 4 },
  revenueSub: { color: '#FFF', fontSize: SIZES.fontLg, ...FONTS.bold },
  revenueDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: (width - 48 - 16) / 2, backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold, marginBottom: 4 },
  statTitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  actionMenu: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionItem: { width: (width - 48 - 48) / 4, alignItems: 'center', marginBottom: 16 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  actionText: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium, textAlign: 'center' },
  gap: { height: 20 },
});

export default Dashboard;
