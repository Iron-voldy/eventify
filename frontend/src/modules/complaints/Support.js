import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { bookingAPI, complaintAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const ISSUE_TYPES = ['booking', 'payment', 'event', 'technical', 'other'];

const Support = () => {
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState({ subject: '', description: '', issueType: 'other', bookingId: '' });
  const [formErrors, setFormErrors] = useState({});
  const [complaintImage, setComplaintImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFormErrors(e => ({ ...e, [key]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const subject = form.subject.trim();
    const description = form.description.trim();
    if (!subject) newErrors.subject = 'Subject is required';
    else if (subject.length < 5) newErrors.subject = 'Subject must be at least 5 characters';
    else if (subject.length > 100) newErrors.subject = 'Subject must be 100 characters or fewer';
    if (!description) newErrors.description = 'Description is required';
    else if (description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    else if (description.length > 1000) newErrors.description = 'Description must be 1000 characters or fewer';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchData = async () => {
    try {
      const [complaintsRes, bookingsRes] = await Promise.all([
        complaintAPI.getMy(),
        bookingAPI.getMy(),
      ]);
      setComplaints(complaintsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.log('Error fetching support data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const pickComplaintImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow media access to upload a screenshot or image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setComplaintImage(result.assets[0]);
    }
  };

  const resetForm = () => {
    setForm({ subject: '', description: '', issueType: 'other', bookingId: '' });
    setComplaintImage(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('subject', form.subject.trim());
      formData.append('description', form.description.trim());
      formData.append('issueType', form.issueType);

      if (form.bookingId) {
        formData.append('bookingId', form.bookingId);
      }

      if (complaintImage?.uri) {
        formData.append('complaintImage', {
          uri: complaintImage.uri,
          name: complaintImage.fileName || 'complaint-image.jpg',
          type: complaintImage.mimeType || 'image/jpeg',
        });
      }

      await complaintAPI.create(formData);
      resetForm();
      setView('list');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Ticket', 'Are you sure you want to delete this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await complaintAPI.delete(id);
            setComplaints(complaints.filter((ticket) => ticket._id !== id));
          } catch (error) {
            Alert.alert('Error', error.message || 'Could not delete ticket');
          }
        },
      },
    ]);
  };

  const renderCreateForm = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
      <Text style={styles.formTitle}>New Support Ticket</Text>
      <CustomInput
        label="Subject *"
        placeholder="Brief description of the issue"
        value={form.subject}
        onChangeText={(text) => handleFormChange('subject', text)}
        error={formErrors.subject}
      />

      <Text style={styles.label}>Issue Type *</Text>
      <View style={styles.typeSelector}>
        {ISSUE_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, form.issueType === type && styles.typeBtnActive]}
            onPress={() => setForm({ ...form, issueType: type })}
          >
            <Text style={[styles.typeText, form.issueType === type && styles.typeTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {bookings.length ? (
        <>
          <Text style={styles.label}>Related Booking (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bookingSelector}>
            <TouchableOpacity
              style={[styles.bookingChip, !form.bookingId && styles.bookingChipActive]}
              onPress={() => setForm({ ...form, bookingId: '' })}
            >
              <Text style={[styles.bookingChipText, !form.bookingId && styles.bookingChipTextActive]}>None</Text>
            </TouchableOpacity>
            {bookings.map((booking) => (
              <TouchableOpacity
                key={booking._id}
                style={[styles.bookingChip, form.bookingId === booking._id && styles.bookingChipActive]}
                onPress={() => setForm({ ...form, bookingId: booking._id })}
              >
                <Text style={[styles.bookingChipText, form.bookingId === booking._id && styles.bookingChipTextActive]}>
                  {booking.eventId?.title ? `${booking.eventId.title.slice(0, 14)}...` : 'Booking'} #{booking._id.slice(-4).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : null}

      <CustomInput
        label="Description *"
        placeholder="Please provide details about your issue..."
        value={form.description}
        onChangeText={(text) => handleFormChange('description', text)}
        multiline
        numberOfLines={6}
        error={formErrors.description}
      />

      <TouchableOpacity style={styles.uploadBtn} onPress={pickComplaintImage}>
        <Ionicons name="image-outline" size={18} color={COLORS.primary} />
        <Text style={styles.uploadBtnText}>{complaintImage ? 'Change Evidence Image' : 'Upload Evidence Image'}</Text>
      </TouchableOpacity>

      {complaintImage?.uri ? (
        <Image source={{ uri: complaintImage.uri }} style={styles.uploadPreview} />
      ) : null}

      <View style={styles.actions}>
        <CustomButton title="Cancel" variant="outline" onPress={() => { resetForm(); setView('list'); }} style={styles.actionBtn} />
        <CustomButton title="Submit Ticket" onPress={handleSubmit} loading={submitting} style={styles.actionBtn} />
      </View>
    </ScrollView>
  );

  const renderItem = ({ item }) => {
    const complaintImageSource = item.complaintImage
      ? { uri: item.complaintImage.startsWith('http') ? item.complaintImage : `${API_URL}${item.complaintImage}` }
      : null;

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.header}>
          <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>
        <Text style={styles.date}>Created {new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.metaLine}>Type: {item.issueType}</Text>
        {item.bookingId ? (
          <Text style={styles.metaLine}>Booking Ref: #{item.bookingId._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
        ) : null}
        <Text style={styles.description}>{item.description}</Text>

        {complaintImageSource ? (
          <Image source={complaintImageSource} style={styles.cardImage} />
        ) : null}

        {item.adminResponse ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Support Response:</Text>
            <Text style={styles.responseText}>{item.adminResponse}</Text>
          </View>
        ) : null}

        {item.status === 'open' ? (
          <View style={styles.deleteRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
              <Text style={styles.deleteBtnText}>Delete Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  if (view === 'create') {
    return <ScreenWrapper scroll={false}>{renderCreateForm()}</ScreenWrapper>;
  }

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>My Support Tickets</Text>
        <CustomButton title="New Ticket" size="sm" onPress={() => setView('create')} icon={<Ionicons name="add" size={16} color="#FFF" />} />
      </View>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState icon="help-buoy-outline" title="No support tickets" subtitle="Need help? Create a new support ticket." />
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  topTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold },
  listContent: { paddingBottom: 20 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subject: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginRight: 16 },
  date: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 10 },
  metaLine: { color: COLORS.primary, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 4 },
  description: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.regular, lineHeight: 20, marginTop: 6 },
  cardImage: { width: '100%', height: 170, borderRadius: SIZES.radiusSm, marginTop: 14 },
  responseBox: { backgroundColor: COLORS.primary + '15', borderRadius: SIZES.radiusSm, padding: 12, marginTop: 16, borderWidth: 1, borderColor: COLORS.primary + '30' },
  responseLabel: { color: COLORS.primary, fontSize: SIZES.fontXs, ...FONTS.bold, marginBottom: 4 },
  responseText: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.regular, lineHeight: 20 },
  deleteRow: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtnText: { color: COLORS.error, fontSize: SIZES.fontXs, ...FONTS.bold },
  formContainer: { paddingTop: 20, paddingBottom: 40 },
  formTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginBottom: 24 },
  label: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 8 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  typeTextActive: { color: '#FFF', ...FONTS.bold },
  bookingSelector: { marginBottom: 18 },
  bookingChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 10 },
  bookingChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bookingChipText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  bookingChipTextActive: { color: '#FFF', ...FONTS.bold },
  uploadBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },
  uploadBtnText: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.bold },
  uploadPreview: { width: '100%', height: 180, borderRadius: SIZES.radius, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 32 },
  actionBtn: { flex: 1 },
});

export default Support;
