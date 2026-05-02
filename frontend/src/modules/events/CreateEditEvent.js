import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { eventAPI, venueAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const CATEGORIES = ['technology', 'music', 'business', 'networking', 'health', 'education', 'workshop', 'conference', 'other'];

const CreateEditEvent = ({ route, navigation }) => {
  const eventId = route?.params?.id;
  const isEditing = Boolean(eventId);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'technology',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    organizerName: '',
    ticketPrice: '0',
    totalSeats: '100',
    seatAllocationMode: 'auto',
    blockedSeats: '',
    status: 'upcoming',
    venueId: '',
  });
  const [imageAsset, setImageAsset] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState([]);

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    const title = form.title.trim();
    const description = form.description.trim();
    const organizerName = form.organizerName.trim();
    const location = form.location.trim();
    const price = Number(form.ticketPrice);
    const seats = Number(form.totalSeats);

    if (!title) newErrors.title = 'Event title is required';
    else if (title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    else if (title.length > 200) newErrors.title = 'Title must be 200 characters or fewer';

    if (description.length > 2000) newErrors.description = 'Description must be 2000 characters or fewer';

    if (!form.eventDate) {
      newErrors.eventDate = 'Event date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate)) {
      newErrors.eventDate = 'Use format YYYY-MM-DD';
    } else if (!isEditing && new Date(form.eventDate) < new Date(new Date().toDateString())) {
      newErrors.eventDate = 'Event date must be in the future';
    }

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!location) newErrors.location = 'Location is required';

    if (!organizerName) newErrors.organizerName = 'Organizer name is required';
    else if (organizerName.length < 2) newErrors.organizerName = 'Organizer name must be at least 2 characters';

    if (form.ticketPrice === '' || isNaN(price) || price < 0) newErrors.ticketPrice = 'Enter a valid price (0 or more)';
    else if (price > 1000000) newErrors.ticketPrice = 'Price seems too high';

    if (form.totalSeats === '' || isNaN(seats) || seats < 1) newErrors.totalSeats = 'Total seats must be at least 1';
    else if (seats > 100000) newErrors.totalSeats = 'Seats value seems too high';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    loadVenues();
    if (isEditing) {
      loadEventDetails();
    }
  }, [eventId]);

  const loadVenues = async () => {
    try {
      const res = await venueAPI.getAll();
      setVenues(res.data || []);
    } catch (error) {
      console.log('Error loading venues:', error);
    }
  };

  const loadEventDetails = async () => {
    try {
      const res = await eventAPI.getOne(eventId);
      const event = res.data;
      setForm({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'technology',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: event.startTime || '09:00',
        endTime: event.endTime || '17:00',
        location: event.location || '',
        organizerName: event.organizerName || '',
        ticketPrice: String(event.ticketPrice ?? 0),
        totalSeats: String(event.totalSeats ?? 0),
        seatAllocationMode: event.seatAllocationMode || 'auto',
        blockedSeats: (event.blockedSeats || []).join(', '),
        status: event.status || 'upcoming',
        venueId: event.venueId?._id || event.venueId || '',
      });
      setExistingImage(event.eventImage || '');
    } catch (error) {
      Alert.alert('Error', 'Could not load event details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow gallery access to upload event images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'blockedSeats') return; // handled separately below
        formData.append(key, String(value));
      });

      // Parse blocked seats: "1, 3, 5" → append each number individually
      if (form.seatAllocationMode === 'manual' && form.blockedSeats.trim()) {
        const parsed = form.blockedSeats.split(',')
          .map(s => s.trim())
          .filter(s => s !== '' && !isNaN(Number(s)));
        parsed.forEach(s => formData.append('blockedSeats', s));
      }

      if (imageAsset?.uri) {
        formData.append('eventImage', {
          uri: imageAsset.uri,
          name: imageAsset.fileName || 'event-image.jpg',
          type: imageAsset.mimeType || 'image/jpeg',
        });
      }

      if (isEditing) {
        await eventAPI.update(eventId, formData);
      } else {
        await eventAPI.create(formData);
      }

      Alert.alert('Success', `Event ${isEditing ? 'updated' : 'created'} successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ScreenWrapper><LoadingSpinner /></ScreenWrapper>;
  }

  const displayImage = imageAsset?.uri
    ? { uri: imageAsset.uri }
    : existingImage
      ? { uri: existingImage.startsWith('http') ? existingImage : `${API_URL}${existingImage}` }
      : null;

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.imageSelector} onPress={pickImage}>
          {displayImage ? (
            <>
              <Image source={displayImage} style={styles.previewImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={32} color="#FFF" />
                <Text style={styles.overlayText}>Change Image</Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.placeholderText}>Tap to add banner image</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <CustomInput label="Event Title *" placeholder="e.g. Global Tech Summit 2026" value={form.title} onChangeText={(text) => handleChange('title', text)} error={errors.title} />
          <CustomInput label="Description" placeholder="Event details..." value={form.description} onChangeText={(text) => handleChange('description', text)} multiline numberOfLines={4} error={errors.description} />

          <Text style={styles.label}>Venue (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.catPill, !form.venueId && styles.catPillActive]}
              onPress={() => setForm({ ...form, venueId: '' })}
            >
              <Text style={[styles.catText, !form.venueId && styles.catTextActive]}>None</Text>
            </TouchableOpacity>
            {venues.map((venue) => (
              <TouchableOpacity
                key={venue._id}
                style={[styles.catPill, form.venueId === venue._id && styles.catPillActive]}
                onPress={() => setForm({ ...form, venueId: venue._id })}
              >
                <Text style={[styles.catText, form.venueId === venue._id && styles.catTextActive]}>
                  {venue.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.catPill, form.category === category && styles.catPillActive]}
                onPress={() => setForm({ ...form, category })}
              >
                <Text style={[styles.catText, form.category === category && styles.catTextActive]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.row}>
            <View style={styles.flexHalfLeft}>
              <CustomInput label="Date (YYYY-MM-DD) *" value={form.eventDate} onChangeText={(text) => handleChange('eventDate', text)} error={errors.eventDate} />
            </View>
            <View style={styles.flexHalfRight}>
              <CustomInput label="Location *" value={form.location} onChangeText={(text) => handleChange('location', text)} error={errors.location} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flexHalfLeft}>
              <CustomInput label="Start Time" value={form.startTime} onChangeText={(text) => handleChange('startTime', text)} />
            </View>
            <View style={styles.flexHalfRight}>
              <CustomInput label="End Time" value={form.endTime} onChangeText={(text) => handleChange('endTime', text)} error={errors.endTime} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flexHalfLeft}>
              <CustomInput label="Ticket Price (LKR) *" value={form.ticketPrice} onChangeText={(text) => handleChange('ticketPrice', text)} keyboardType="numeric" error={errors.ticketPrice} />
            </View>
            <View style={styles.flexHalfRight}>
              <CustomInput label="Total Seats *" value={form.totalSeats} onChangeText={(text) => handleChange('totalSeats', text)} keyboardType="numeric" error={errors.totalSeats} />
            </View>
          </View>

          <CustomInput label="Organizer Name *" value={form.organizerName} onChangeText={(text) => handleChange('organizerName', text)} error={errors.organizerName} />

          {/* Seat Allocation Mode */}
          <Text style={styles.label}>Seat Allocation Mode</Text>
          <View style={styles.toggleRow}>
            {['auto', 'manual'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.toggleBtn, form.seatAllocationMode === mode && styles.toggleBtnActive]}
                onPress={() => handleChange('seatAllocationMode', mode)}
              >
                <Ionicons
                  name={mode === 'auto' ? 'shuffle-outline' : 'grid-outline'}
                  size={18}
                  color={form.seatAllocationMode === mode ? '#FFF' : COLORS.textSecondary}
                />
                <Text style={[styles.toggleBtnText, form.seatAllocationMode === mode && styles.toggleBtnTextActive]}>
                  {mode === 'auto' ? 'Auto Allocation' : 'Manual Selection'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.allocationHint}>
            {form.seatAllocationMode === 'auto'
              ? 'Seats are assigned automatically in order when a booking is made.'
              : 'Customers will see a seat map and choose their own seats.'}
          </Text>

          {form.seatAllocationMode === 'manual' && (
            <CustomInput
              label="Blocked Seats (comma-separated)"
              placeholder="e.g. 1, 2, 15, 16"
              value={form.blockedSeats}
              onChangeText={(text) => handleChange('blockedSeats', text)}
              keyboardType="default"
            />
          )}

          {isEditing ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.label}>Event Status</Text>
              <View style={styles.statusRow}>
                {['upcoming', 'ongoing', 'completed', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusRadio, form.status === status && styles.statusActive]}
                    onPress={() => setForm({ ...form, status })}
                  >
                    <Text style={[styles.statusText, form.status === status && styles.statusTextActive]}>
                      {status.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <CustomButton title={isEditing ? 'Update Event' : 'Create Event'} onPress={handleSave} loading={saving} style={styles.submitBtn} />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  content: { paddingBottom: 40 },
  imageSelector: { height: 200, backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: '#FFF', ...FONTS.bold, marginTop: 8 },
  placeholderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.textMuted, marginTop: 12, ...FONTS.medium },
  formGroup: { marginBottom: 20 },
  label: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.bold, marginBottom: 8 },
  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { color: COLORS.textSecondary, ...FONTS.medium },
  catTextActive: { color: '#FFF', ...FONTS.bold },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  flexHalfLeft: { flex: 1, marginRight: 8 },
  flexHalfRight: { flex: 1, marginLeft: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusRadio: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  statusActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  statusText: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium },
  statusTextActive: { color: COLORS.primary, ...FONTS.bold },
  submitBtn: { marginTop: 16, height: 56 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleBtnText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  toggleBtnTextActive: { color: '#FFF', ...FONTS.bold },
  allocationHint: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 16, lineHeight: 18 },
});

export default CreateEditEvent;
