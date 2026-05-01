import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/api';
import { Image } from 'react-native';

const ProfileMenu = ({ icon, title, onPress, danger = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: danger ? COLORS.error + '20' : COLORS.surfaceLight }]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.error : COLORS.primary} />
    </View>
    <Text style={[styles.menuTitle, danger && { color: COLORS.error }]}>{title}</Text>
    <Ionicons name="chevron-forward" size={20} color={danger ? COLORS.error : COLORS.textMuted} />
  </TouchableOpacity>
);

const Profile = ({ navigation }) => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const imageSource = user?.profileImage
    ? { uri: user.profileImage.startsWith('http') ? user.profileImage : `${API_URL}${user.profileImage}` }
    : null;

  return (
    <ScreenWrapper>
      <Text style={styles.pageTitle}>My Profile</Text>

      <View style={[styles.profileCard, SHADOWS.medium]}>
        <View style={styles.avatarWrap}>
          {imageSource ? (
            <Image source={imageSource} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{(user?.fullName || 'U')[0].toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="pencil" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMINISTRATOR</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuGroup}>
        <ProfileMenu icon="person-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <ProfileMenu icon="shield-checkmark-outline" title="Change Password" onPress={() => {}} />
      </View>

      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.menuGroup}>
        <ProfileMenu icon="ticket-outline" title="My Bookings" onPress={() => navigation.navigate('Bookings')} />
        <ProfileMenu icon="pricetag-outline" title="Promotions" onPress={() => navigation.navigate('Promotions')} />
        <ProfileMenu icon="star-outline" title="My Reviews" onPress={() => navigation.navigate('Reviews')} />
        <ProfileMenu icon="headset-outline" title="Support & Help" onPress={() => navigation.navigate('Support')} />
      </View>

      <View style={styles.menuGroup}>
        <ProfileMenu icon="log-out-outline" title="Log Out" onPress={handleLogout} danger />
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 24 },
  profileCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 24, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: COLORS.glassBorder },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarInitials: { color: '#FFF', fontSize: 36, ...FONTS.bold },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.card },
  name: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold, marginBottom: 4 },
  email: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 12 },
  adminBadge: { backgroundColor: COLORS.accent + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.accent },
  adminBadgeText: { color: COLORS.accent, fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 1 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  menuGroup: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuTitle: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.medium },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium, marginTop: 16, marginBottom: 32 },
});

export default Profile;
