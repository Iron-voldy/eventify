import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../context/AuthContext';

const AdminMore = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('AdminLogin');
        },
      },
    ]);
  };

  const MenuItem = ({ icon, title, subtitle, onPress, isDanger = false }) => (
    <TouchableOpacity
      style={[styles.menuItem, SHADOWS.small]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: isDanger ? COLORS.error + '15' : COLORS.primary + '15' }]}>
        <Ionicons name={icon} size={24} color={isDanger ? COLORS.error : COLORS.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Admin Info Card */}
        <View style={[styles.adminCard, SHADOWS.small]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{(user?.fullName || 'A')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.adminName}>{user?.fullName || 'Admin'}</Text>
          <Text style={styles.adminEmail}>{user?.email || 'admin@eventify.com'}</Text>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Settings & Support</Text>

        <MenuItem
          icon="business-outline"
          title="Manage Venues"
          subtitle="Add, edit and delete venues"
          onPress={() => navigation.navigate('ManageVenues')}
        />


        <MenuItem
          icon="document-text-outline"
          title="About This App"
          subtitle="Version 1.0.0"
          onPress={() => Alert.alert('About', 'Admin Dashboard v1.0.0\n\nEvent Management System')}
        />

        <MenuItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Contact us for assistance"
          onPress={() => Alert.alert('Support', 'For help, email: support@eventify.com')}
        />

        <MenuItem
          icon="information-circle-outline"
          title="Privacy Policy"
          subtitle="View our privacy terms"
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content would go here.')}
        />

        <View style={styles.divider} />

        {/* Logout */}
        <MenuItem
          icon="log-out-outline"
          title="Logout"
          subtitle={`Logged in as ${user?.role || 'admin'}`}
          onPress={handleLogout}
          isDanger={true}
        />

        <View style={styles.gap} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  adminCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusMd,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#FFF', fontSize: SIZES.fontXxl, ...FONTS.bold },
  adminName: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: 4 },
  adminEmail: { color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium },
  sectionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 16, marginTop: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusMd,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  menuIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 2 },
  menuSubtitle: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  gap: { height: 20 },
});

export default AdminMore;
