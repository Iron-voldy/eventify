import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { eventAPI } from '../../services/api';

const ManageEvents = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await eventAPI.getAll({ search });
      setEvents(res.data);
    } catch (error) {
      console.log('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [search])
  );

  const handleDelete = (id) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await eventAPI.delete(id);
            setEvents(events.filter(e => e._id !== id));
            Alert.alert('Success', 'Event deleted successfully');
          } catch (error) {
            Alert.alert('Error', error.message || 'Could not delete event');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.small]}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{new Date(item.eventDate).toLocaleDateString()}</Text>
        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={{ marginLeft: 12 }} />
        <Text style={styles.infoText}>{item.startTime}</Text>
      </View>
      <View style={[styles.row, { marginTop: 4, marginBottom: 16 }]}>
        <Ionicons name="ticket-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{item.availableSeats}/{item.totalSeats} seats</Text>
        <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} style={{ marginLeft: 12 }} />
        <Text style={styles.infoText}>LKR {item.ticketPrice}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('EventDetails', { id: item._id })}>
          <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CreateEditEvent', { id: item._id })}>
          <Ionicons name="pencil-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { borderColor: COLORS.error + '50' }]} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Manage Events</Text>
        <CustomButton
          title="Create"
          icon={<Ionicons name="add" size={16} color="#FFF" />}
          size="sm"
          onPress={() => navigation.navigate('CreateEditEvent')}
        />
      </View>

      <CustomInput
        placeholder="Search events by title or location..."
        value={search}
        onChangeText={setSearch}
        icon={<Ionicons name="search" size={20} color={COLORS.textMuted} />}
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events found" />}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginRight: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  infoText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginLeft: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
});

export default ManageEvents;
