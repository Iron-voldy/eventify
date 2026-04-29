import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { venueAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const FACILITIES_OPTIONS = ['Parking', 'WiFi', 'Catering', 'AV Equipment', 'Air Conditioning', 'Accessibility'];

const ManageVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pickedImage, setPickedImage] = useState(null);
  const [existingImage, setExistingImage] = useState('');

  const emptyForm = {
    name: '',
    address: '',
    city: '',
    capacity: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [facilities, setFacilities] = useState([]);

  const fetchVenues = async (query = search) => {
    try {
      const params = query ? { search: query } : {};
      const res = await venueAPI.getAll(params);
      setVenues(res.data);
    } catch (error) {
      console.log('Error fetching venues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchVenues(); }, []));

  const openCreate = () => {
    setForm(emptyForm);
    setFacilities([]);
    setEditTarget(null);
    setPickedImage(null);
    setExistingImage('');
    setView('create');
  };

  const openEdit = (venue) => {
    setForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      capacity: String(venue.capacity),
      description: venue.description || '',
      contactPhone: venue.contactPhone || '',
      contactEmail: venue.contactEmail || '',
    });
    setFacilities(venue.facilities || []);
    setEditTarget(venue);
    setPickedImage(null);
    setExistingImage(venue.venueImage || '');
    setView('edit');
  };

  const toggleFacility = (facility) => {
    setFacilities((current) =>
      current.includes(facility)
        ? current.filter((item) => item !== facility)
        : [...current, facility]
    );
  };

  const pickVenueImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow media access to upload the venue image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.address || !form.city || !form.capacity) {
      Alert.alert('Error', 'Name, address, city and capacity are required.');
      return;
    }

    if (isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      Alert.alert('Error', 'Capacity must be a positive number.');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      facilities.forEach((facility) => formData.append('facilities', facility));

      if (pickedImage?.uri) {
        formData.append('venueImage', {
          uri: pickedImage.uri,
          name: pickedImage.fileName || 'venue-image.jpg',
          type: pickedImage.mimeType || 'image/jpeg',
        });
      }

      if (view === 'edit') {
        await venueAPI.update(editTarget._id, formData);
        Alert.alert('Success', 'Venue updated successfully.');
      } else {
        await venueAPI.create(formData);
        Alert.alert('Success', 'Venue created successfully.');
      }

      setView('list');
      fetchVenues();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save venue.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (venue) => {
    Alert.alert(
      'Delete Venue',
      `Are you sure you want to delete "${venue.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await venueAPI.delete(venue._id);
              setVenues(venues.filter((item) => item._id !== venue._id));
            } catch (error) {
              Alert.alert('Error', error.message || 'Could not delete venue');
            }
          },
        },
      ]
    );
  };

  const resolvedPreview = pickedImage?.uri
    ? { uri: pickedImage.uri }
    : existingImage
      ? { uri: existingImage.startsWith('http') ? existingImage : `${API_URL}${existingImage}` }
      : null;

  const renderVenueCard = ({ item }) => {
    const venueImageSource = item.venueImage
      ? { uri: item.venueImage.startsWith('http') ? item.venueImage : `${API_URL}${item.venueImage}` }
      : null;

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.cardTop}>
          {venueImageSource ? (
            <Image source={venueImageSource} style={styles.cardImage} />
          ) : (
            <View style={styles.cardIcon}>
              <Ionicons name="business" size={24} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.cardInfo}>
            <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.venueCity}>{item.city}</Text>
            <Text style={styles.venueAddress} numberOfLines={1}>{item.address}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>Capacity: {item.capacity}</Text>
          </View>
          {item.facilities?.length > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
              <Text style={styles.metaText}>
                {item.facilities.slice(0, 2).join(', ')}{item.facilities.length > 2 ? '...' : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderForm = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
      <Text style={styles.formTitle}>{view === 'edit' ? 'Edit Venue' : 'New Venue'}</Text>

      <TouchableOpacity style={styles.imageSelector} onPress={pickVenueImage}>
        {resolvedPreview ? (
          <Image source={resolvedPreview} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.imagePlaceholderText}>Tap to upload venue image</Text>
          </View>
        )}
      </TouchableOpacity>

      <CustomInput label="Venue Name *" placeholder="e.g. Grand Convention Centre" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} />
      <CustomInput label="Address *" placeholder="Street address" value={form.address} onChangeText={(text) => setForm({ ...form, address: text })} />
      <View style={styles.row}>
        <View style={styles.flexHalfLeft}>
          <CustomInput label="City *" placeholder="Colombo" value={form.city} onChangeText={(text) => setForm({ ...form, city: text })} />
        </View>
        <View style={styles.flexHalfRight}>
          <CustomInput label="Capacity *" placeholder="500" value={form.capacity} onChangeText={(text) => setForm({ ...form, capacity: text })} keyboardType="numeric" />
        </View>
      </View>
      <CustomInput label="Description" placeholder="About this venue..." value={form.description} onChangeText={(text) => setForm({ ...form, description: text })} multiline numberOfLines={3} />
      <View style={styles.row}>
        <View style={styles.flexHalfLeft}>
          <CustomInput label="Contact Phone" placeholder="+94 11 234 5678" value={form.contactPhone} onChangeText={(text) => setForm({ ...form, contactPhone: text })} keyboardType="phone-pad" />
        </View>
        <View style={styles.flexHalfRight}>
          <CustomInput label="Contact Email" placeholder="venue@example.com" value={form.contactEmail} onChangeText={(text) => setForm({ ...form, contactEmail: text })} keyboardType="email-address" autoCapitalize="none" />
        </View>
      </View>

      <Text style={styles.label}>Facilities</Text>
      <View style={styles.facilitiesGrid}>
        {FACILITIES_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.facilityPill, facilities.includes(item) && styles.facilityPillActive]}
            onPress={() => toggleFacility(item)}
          >
            <Text style={[styles.facilityText, facilities.includes(item) && styles.facilityTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formActions}>
        <CustomButton title="Cancel" variant="outline" onPress={() => setView('list')} style={styles.actionBtn} />
        <CustomButton title={view === 'edit' ? 'Update' : 'Create'} onPress={handleSave} loading={saving} style={styles.actionBtn} />
      </View>
    </ScrollView>
  );

  if (loading) {
    return <ScreenWrapper><LoadingSpinner /></ScreenWrapper>;
  }

  if (view === 'create' || view === 'edit') {
    return <ScreenWrapper scroll={false}>{renderForm()}</ScreenWrapper>;
  }

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Venues</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <CustomInput
        placeholder="Search venues..."
        value={search}
        onChangeText={(text) => { setSearch(text); fetchVenues(text); }}
        icon={<Ionicons name="search" size={20} color={COLORS.textMuted} />}
        style={styles.searchInput}
      />

      <FlatList
        data={venues}
        keyExtractor={(item) => item._id}
        renderItem={renderVenueCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVenues(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="business-outline" title="No venues found" subtitle="Tap + to add a new venue" />}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 16 },
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  searchInput: { marginBottom: 16 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardImage: { width: 52, height: 52, borderRadius: 14, marginRight: 12 },
  cardIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  venueName: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 2 },
  venueCity: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 2 },
  venueAddress: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.regular },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },
  formContent: { paddingBottom: 40 },
  formTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 24 },
  imageSelector: {
    height: 180,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: COLORS.textMuted, ...FONTS.medium, marginTop: 8 },
  row: { flexDirection: 'row' },
  flexHalfLeft: { flex: 1, marginRight: 8 },
  flexHalfRight: { flex: 1, marginLeft: 8 },
  label: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.bold, marginBottom: 10 },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  facilityPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  facilityPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  facilityText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  facilityTextActive: { color: '#FFF', ...FONTS.bold },
  formActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

export default ManageVenues;
