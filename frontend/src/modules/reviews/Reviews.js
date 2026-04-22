import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { bookingAPI, reviewAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const Reviews = ({ navigation }) => {
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createEventId, setCreateEventId] = useState('');
  const [createRating, setCreateRating] = useState(5);
  const [createComment, setCreateComment] = useState('');
  const [createImage, setCreateImage] = useState(null);
  const [creating, setCreating] = useState(false);

  const [editModal, setEditModal] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editExistingImage, setEditExistingImage] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [reviewRes, bookingRes] = await Promise.all([
        reviewAPI.getMy(),
        bookingAPI.getMy(),
      ]);
      setReviews(reviewRes.data || []);
      setBookings(bookingRes.data || []);
    } catch (error) {
      console.log('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const reviewedEventIds = useMemo(
    () => new Set(reviews.map((review) => review.eventId?._id).filter(Boolean)),
    [reviews]
  );

  const reviewableBookings = useMemo(() => {
    const uniqueEvents = new Map();

    bookings
      .filter((booking) => booking.bookingStatus === 'confirmed' && booking.eventId?._id)
      .forEach((booking) => {
        if (!uniqueEvents.has(booking.eventId._id)) {
          uniqueEvents.set(booking.eventId._id, booking);
        }
      });

    return Array.from(uniqueEvents.values()).filter(
      (booking) => !reviewedEventIds.has(booking.eventId._id)
    );
  }, [bookings, reviewedEventIds]);

  const resetCreateForm = () => {
    setCreateEventId(reviewableBookings[0]?.eventId?._id || '');
    setCreateRating(5);
    setCreateComment('');
    setCreateImage(null);
  };

  const openCreate = () => {
    if (reviewableBookings.length === 0) {
      Alert.alert(
        'No Reviewable Events',
        'You can add reviews only for events you have already booked and not reviewed yet.'
      );
      return;
    }

    setCreateEventId(reviewableBookings[0]?.eventId?._id || '');
    setCreateRating(5);
    setCreateComment('');
    setCreateImage(null);
    setCreateModalVisible(true);
  };

  const openEdit = (review) => {
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditModal(review);
    setEditImage(null);
    setEditExistingImage(review.reviewImage || '');
    setRemoveExistingImage(false);
  };

  const pickReviewImage = async (setImage) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow media access to upload an optional review image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const buildReviewFormData = ({ eventId, rating, comment, image, removeImage }) => {
    const formData = new FormData();

    if (eventId) {
      formData.append('eventId', eventId);
    }

    formData.append('rating', String(rating));
    formData.append('comment', comment.trim());

    if (image?.uri) {
      formData.append('reviewImage', {
        uri: image.uri,
        name: image.fileName || 'review-image.jpg',
        type: image.mimeType || 'image/jpeg',
      });
    }

    if (removeImage) {
      formData.append('removeReviewImage', 'true');
    }

    return formData;
  };

  const handleCreateReview = async () => {
    if (!createEventId) {
      Alert.alert('Select Event', 'Choose the booked event you want to review.');
      return;
    }

    if (!createComment.trim()) {
      Alert.alert('Missing Comment', 'Please write a short review before submitting.');
      return;
    }

    try {
      setCreating(true);
      await reviewAPI.create(
        buildReviewFormData({
          eventId: createEventId,
          rating: createRating,
          comment: createComment,
          image: createImage,
        })
      );
      setCreateModalVisible(false);
      resetCreateForm();
      await fetchData();
      Alert.alert('Review Added', 'Your review has been posted successfully.');
    } catch (error) {
      Alert.alert('Could Not Add Review', error.message || 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editComment.trim()) {
      Alert.alert('Missing Comment', 'Comment cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await reviewAPI.update(
        editModal._id,
        buildReviewFormData({
          rating: editRating,
          comment: editComment,
          image: editImage,
          removeImage: removeExistingImage,
        })
      );
      setEditModal(null);
      setEditImage(null);
      setEditExistingImage('');
      setRemoveExistingImage(false);
      await fetchData();
      Alert.alert('Review Updated', 'Your review changes have been saved.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not update review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewAPI.delete(id);
            await fetchData();
          } catch (error) {
            Alert.alert('Error', 'Could not delete review');
          }
        },
      },
    ]);
  };

  const renderStars = (rating, interactive = false, onChange) => (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && onChange?.(i + 1)}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Ionicons
            name={i < rating ? 'star' : 'star-outline'}
            size={interactive ? 28 : 16}
            color={i < rating ? COLORS.warning : COLORS.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const getImageSource = (image) => {
    if (!image) return null;

    if (typeof image === 'string') {
      return { uri: image.startsWith('http') ? image : `${API_URL}${image}` };
    }

    if (image.uri) {
      return { uri: image.uri };
    }

    return null;
  };

  const renderImageUploader = ({ image, existingImage, onPick, onRemove, removeLabel }) => {
    const imageSource = getImageSource(image) || getImageSource(existingImage);

    return (
      <View style={styles.imageUploaderWrap}>
        <Text style={styles.inputLabel}>Optional Image</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={onPick}>
          <Ionicons name="image-outline" size={18} color={COLORS.primary} />
          <Text style={styles.uploadBtnText}>{imageSource ? 'Change Review Image' : 'Upload Review Image'}</Text>
        </TouchableOpacity>

        {imageSource ? (
          <>
            <Image source={imageSource} style={styles.reviewPreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={onRemove}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              <Text style={styles.removeImageText}>{removeLabel}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    );
  };

  const renderReviewableEventOption = (booking) => {
    const isSelected = createEventId === booking.eventId?._id;

    return (
      <TouchableOpacity
        key={booking._id}
        style={[styles.eventOption, isSelected && styles.eventOptionActive]}
        onPress={() => setCreateEventId(booking.eventId._id)}
      >
        <Text style={[styles.eventOptionTitle, isSelected && styles.eventOptionTitleActive]}>
          {booking.eventId?.title}
        </Text>
        <Text style={styles.eventOptionMeta}>
          {booking.eventId?.eventDate ? new Date(booking.eventId.eventDate).toLocaleDateString() : 'Booked event'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const reviewImageSource = item.reviewImage
      ? { uri: item.reviewImage.startsWith('http') ? item.reviewImage : `${API_URL}${item.reviewImage}` }
      : null;

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <View style={styles.header}>
          <Text style={styles.eventTitle} numberOfLines={1}>{item.eventId?.title || 'Unknown Event'}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stars}>{renderStars(item.rating)}</View>
        <Text style={styles.comment}>{item.comment}</Text>
        {reviewImageSource ? (
          <Image source={reviewImageSource} style={styles.reviewImage} />
        ) : null}
        <Text style={styles.date}>Posted on {new Date(item.reviewDate || item.createdAt).toLocaleDateString()}</Text>
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('UserRoot', { screen: 'Profile' });
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>My Reviews</Text>

        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.helperCard}>
              <Text style={styles.helperTitle}>Add a new review</Text>
              <Text style={styles.helperText}>
                Tap `Add`, choose one of your booked events, rate it, write a comment, and optionally upload one image.
              </Text>
              <Text style={styles.helperMeta}>
                {reviewableBookings.length > 0
                  ? `${reviewableBookings.length} booked event(s) available to review`
                  : 'No reviewable booked events available right now'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon="star-half-outline" title="No reviews yet" subtitle="Use the Add button to review one of your booked events." />
          }
        />
      )}

      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Review</Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Choose Event</Text>
            <View style={styles.eventOptionsWrap}>
              {reviewableBookings.map(renderReviewableEventOption)}
            </View>

            <Text style={styles.ratingLabel}>Rating</Text>
            <View style={styles.ratingBlock}>
              {renderStars(createRating, true, setCreateRating)}
            </View>

            <CustomInput
              label="Comment"
              placeholder="Share your experience..."
              value={createComment}
              onChangeText={setCreateComment}
              multiline
              numberOfLines={5}
            />

            {renderImageUploader({
              image: createImage,
              existingImage: '',
              onPick: () => pickReviewImage(setCreateImage),
              onRemove: () => setCreateImage(null),
              removeLabel: 'Remove selected image',
            })}

            <View style={styles.modalActionSpace} />
            <CustomButton title="Submit Review" onPress={handleCreateReview} loading={creating} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={editModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            <TouchableOpacity onPress={() => setEditModal(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.eventNameLabel}>{editModal?.eventId?.title}</Text>
            <Text style={styles.ratingLabel}>Rating</Text>
            <View style={styles.ratingBlock}>
              {renderStars(editRating, true, setEditRating)}
            </View>

            <CustomInput
              label="Comment"
              placeholder="Share your experience..."
              value={editComment}
              onChangeText={setEditComment}
              multiline
              numberOfLines={5}
            />

            {renderImageUploader({
              image: editImage,
              existingImage: removeExistingImage ? '' : editExistingImage,
              onPick: () => {
                setRemoveExistingImage(false);
                pickReviewImage(setEditImage);
              },
              onRemove: () => {
                setEditImage(null);
                setRemoveExistingImage(true);
                setEditExistingImage('');
              },
              removeLabel: 'Remove current image',
            })}

            <View style={styles.modalActionSpace} />
            <CustomButton title="Save Changes" onPress={handleSaveEdit} loading={saving} />
          </ScrollView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  backText: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.bold, marginLeft: 6 },
  pageTitle: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  addBtnText: { color: '#FFF', fontSize: SIZES.fontSm, ...FONTS.bold },
  helperCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radiusMd,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  helperTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 6 },
  helperText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.regular, lineHeight: 20, marginBottom: 8 },
  helperMeta: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.medium },
  listContent: { paddingVertical: 16 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventTitle: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginRight: 8 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  starRow: { flexDirection: 'row', gap: 4 },
  stars: { marginBottom: 12 },
  comment: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.regular, lineHeight: 22, marginBottom: 12 },
  reviewImage: { width: '100%', height: 190, borderRadius: SIZES.radiusSm, marginBottom: 12 },
  date: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },

  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  modalContent: { padding: 20 },
  eventNameLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 20 },
  inputLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 10 },
  eventOptionsWrap: { marginBottom: 24 },
  eventOption: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  eventOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },
  eventOptionTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 4 },
  eventOptionTitleActive: { color: COLORS.primary },
  eventOptionMeta: { color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium },
  ratingLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 10 },
  ratingBlock: { marginBottom: 24 },
  imageUploaderWrap: { marginBottom: 8 },
  uploadBtn: {
    marginTop: 2,
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
  reviewPreview: { width: '100%', height: 190, borderRadius: SIZES.radius, marginTop: 12 },
  removeImageBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.error + '80',
    backgroundColor: COLORS.error + '10',
  },
  removeImageText: { color: COLORS.error, fontSize: SIZES.fontSm, ...FONTS.bold },
  modalActionSpace: { height: 32 },
});

export default Reviews;
