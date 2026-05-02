import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { complaintAPI } from '../../services/api';
import { API_URL } from '../../constants/api';

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await complaintAPI.getAll();
      setComplaints(res.data);
    } catch (error) {
      console.log('Error fetching admin complaints:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  const handleResponse = async () => {
    if (!response.trim()) return;
    try {
      setSubmitting(true);
      await complaintAPI.update(respondingTo, { adminResponse: response.trim(), status: 'resolved' });
      setComplaints(complaints.map((ticket) =>
        ticket._id === respondingTo
          ? { ...ticket, adminResponse: response.trim(), status: 'resolved' }
          : ticket
      ));
      setRespondingTo(null);
      setResponse('');
      Alert.alert('Success', 'Response submitted and ticket resolved.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await complaintAPI.update(id, { status: newStatus });
      setComplaints(complaints.map((ticket) => ticket._id === id ? { ...ticket, status: newStatus } : ticket));
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not update status');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Ticket', 'Permanently delete this support ticket?', [
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

  const renderItem = ({ item }) => {
    const complaintImageSource = item.complaintImage
      ? { uri: item.complaintImage.startsWith('http') ? item.complaintImage : `${API_URL}${item.complaintImage}` }
      : null;

    return (
      <View style={[styles.card, SHADOWS.small, item.status === 'open' && styles.openCard]}>
        <View style={styles.header}>
          <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>By: {item.userId?.fullName || 'Unknown'}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.tagRow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{item.issueType.toUpperCase()}</Text>
          </View>
          {item.bookingId ? (
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>BOOKING #{item.bookingId._id?.slice(-4).toUpperCase() || 'N/A'}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.description}>{item.description}</Text>

        {complaintImageSource ? (
          <Image source={complaintImageSource} style={styles.cardImage} />
        ) : null}

        {item.adminResponse ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Past Admin Response:</Text>
            <Text style={styles.responseText}>{item.adminResponse}</Text>
          </View>
        ) : null}

        {item.status === 'open' && respondingTo !== item._id ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.replyBtn} onPress={() => setRespondingTo(item._id)}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.replyBtnText}>Respond & Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: COLORS.warning + '60' }]} onPress={() => handleStatusChange(item._id, 'in_progress')}>
              <Text style={[styles.quickBtnText, { color: COLORS.warning }]}>In Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: COLORS.error + '60' }]} onPress={() => handleStatusChange(item._id, 'rejected')}>
              <Text style={[styles.quickBtnText, { color: COLORS.error }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {item.status === 'in_progress' && respondingTo !== item._id ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.replyBtn} onPress={() => setRespondingTo(item._id)}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.replyBtnText}>Respond & Resolve</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.deleteRow}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
            <Ionicons name="trash-outline" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {respondingTo === item._id ? (
          <View style={styles.replyForm}>
            <CustomInput
              placeholder="Type your response here..."
              value={response}
              onChangeText={setResponse}
              multiline
              numberOfLines={4}
            />
            <View style={styles.replyActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRespondingTo(null); setResponse(''); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <CustomButton title="Submit" size="sm" onPress={handleResponse} loading={submitting} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <Text style={styles.pageTitle}>Support Tickets</Text>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchComplaints(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="help-buoy-outline" title="No support tickets" />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold, marginTop: 16, marginBottom: 16 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  openCard: { borderColor: COLORS.primary + '50', backgroundColor: COLORS.primary + '05' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginRight: 12 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metaText: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeTag: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border },
  typeText: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.bold, letterSpacing: 0.5 },
  description: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.regular, lineHeight: 20 },
  cardImage: { width: '100%', height: 180, borderRadius: SIZES.radiusSm, marginTop: 14 },
  responseBox: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm, padding: 12, marginTop: 16, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.success },
  responseLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.bold, marginBottom: 4 },
  responseText: { color: COLORS.textPrimary, fontSize: SIZES.fontSm, ...FONTS.regular, lineHeight: 20 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primary + '15' },
  replyBtnText: { color: COLORS.primary, fontSize: SIZES.fontSm, ...FONTS.bold },
  replyForm: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  replyActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: COLORS.textMuted, ...FONTS.bold, fontSize: SIZES.fontSm },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusFull, borderWidth: 1 },
  quickBtnText: { fontSize: SIZES.fontXs, ...FONTS.bold },
  deleteRow: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtnText: { color: COLORS.error, fontSize: SIZES.fontXs, ...FONTS.bold },
});

export default ManageComplaints;
