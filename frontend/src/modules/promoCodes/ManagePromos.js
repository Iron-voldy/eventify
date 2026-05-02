import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { promoAPI } from '../../services/api';

const defaultExpiry = () => new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];
const EMPTY_FORM = { title: '', code: '', description: '', discountType: 'fixed', discountValue: '', minBookingAmount: '0', usageLimit: '', expiryDate: defaultExpiry() };

const ManagePromos = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingPromo, setEditingPromo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFormErrors(e => ({ ...e, [key]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    const discountValue = Number(form.discountValue);
    const usageLimit = Number(form.usageLimit);

    if (!title) newErrors.title = 'Title is required';

    if (!code) newErrors.code = 'Promo code is required';
    else if (!/^[A-Z0-9_-]{3,20}$/.test(code)) newErrors.code = 'Code must be 3-20 alphanumeric characters (A-Z, 0-9, -, _)';

    if (form.discountValue === '' || isNaN(discountValue) || discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    } else if (form.discountType === 'percentage' && discountValue > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }

    if (form.usageLimit === '' || isNaN(usageLimit) || usageLimit < 1) {
      newErrors.usageLimit = 'Usage limit must be at least 1';
    }

    if (!form.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate)) {
      newErrors.expiryDate = 'Use format YYYY-MM-DD';
    } else if (new Date(form.expiryDate) <= new Date(new Date().toDateString())) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchPromos = async () => {
    try {
      const res = await promoAPI.getAll();
      setPromos(res.data);
    } catch (error) {
      console.log('Error fetching promos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPromos(); }, []));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingPromo(null);
    setModalMode('create');
  };

  const openEdit = (promo) => {
    setForm({
      title: promo.title || '',
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType || 'fixed',
      discountValue: String(promo.discountValue),
      minBookingAmount: String(promo.minBookingAmount || '0'),
      usageLimit: String(promo.usageLimit),
      expiryDate: new Date(promo.expiryDate).toISOString().split('T')[0],
    });
    setEditingPromo(promo);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditingPromo(null); setForm(EMPTY_FORM); setFormErrors({}); };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minBookingAmount: Number(form.minBookingAmount) || 0,
        usageLimit: Number(form.usageLimit),
        expiryDate: form.expiryDate,
      };
      if (modalMode === 'create') {
        const res = await promoAPI.create(payload);
        setPromos([res.data, ...promos]);
      } else {
        await promoAPI.update(editingPromo._id, payload);
        setPromos(promos.map(p => p._id === editingPromo._id ? { ...p, ...payload } : p));
      }
      closeModal();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Promo Code', 'Are you sure you want to delete this promo code?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await promoAPI.delete(id);
            setPromos(promos.filter(p => p._id !== id));
          } catch (error) {
            Alert.alert('Error', 'Could not delete promo code');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (promo) => {
    try {
      await promoAPI.update(promo._id, { isActive: !promo.isActive });
      setPromos(promos.map(p => p._id === promo._id ? { ...p, isActive: !promo.isActive } : p));
    } catch (error) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  const DiscountTypeBtn = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.typeBtn, form.discountType === value && styles.typeBtnActive]}
      onPress={() => setForm(f => ({ ...f, discountType: value }))}
    >
      <Text style={[styles.typeBtnText, form.discountType === value && styles.typeBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const isExpired = new Date(item.expiryDate) < new Date();
    const isMaxedOut = item.usedCount >= item.usageLimit;
    return (
      <View style={[styles.card, SHADOWS.small, (!item.isActive || isExpired || isMaxedOut) && styles.cardInactive]}>
        <View style={styles.header}>
          <View style={styles.codeWrap}>
            <Ionicons name="pricetag" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {item.title ? <Text style={styles.promoTitle}>{item.title}</Text> : null}
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Discount</Text>
            <Text style={styles.statValue}>{item.discountType === 'percentage' ? `${item.discountValue}%` : `LKR ${item.discountValue}`}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Usage</Text>
            <Text style={styles.statValue}>{item.usedCount} / {item.usageLimit}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <TouchableOpacity onPress={() => toggleStatus(item)}>
              <Text style={[styles.statValue, { color: item.isActive ? COLORS.success : COLORS.error }]}>
                {item.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {(item.minBookingAmount > 0) && (
          <Text style={styles.minText}>Min. booking: LKR {item.minBookingAmount}</Text>
        )}
        <Text style={styles.expiryText}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Promo Codes</Text>
        <CustomButton title="New Promo" size="sm" icon={<Ionicons name="add" size={16} color="#FFF" />} onPress={openCreate} />
      </View>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={promos}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPromos(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No promo codes found" />}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalMode !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalMode === 'create' ? 'Create Promo Code' : 'Edit Promo Code'}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <CustomInput label="Title *" placeholder="Summer Sale" value={form.title} onChangeText={t => handleFormChange('title', t)} error={formErrors.title} />
            <CustomInput label="Promo Code *" placeholder="SUMMER50" value={form.code} onChangeText={t => handleFormChange('code', t)} autoCapitalize="characters" error={formErrors.code} />
            <CustomInput label="Description" placeholder="Flat discount for summer events" value={form.description} onChangeText={t => handleFormChange('description', t)} />

            <Text style={styles.sectionLabel}>Discount Type *</Text>
            <View style={styles.optionRow}>
              <DiscountTypeBtn value="fixed" label="Fixed (LKR)" />
              <DiscountTypeBtn value="percentage" label="Percentage (%)" />
            </View>

            <CustomInput
              label={`Discount Value * (${form.discountType === 'percentage' ? '%' : 'LKR'})`}
              value={form.discountValue}
              onChangeText={t => handleFormChange('discountValue', t)}
              keyboardType="numeric"
              error={formErrors.discountValue}
            />
            <CustomInput label="Minimum Booking Amount (LKR)" value={form.minBookingAmount} onChangeText={t => handleFormChange('minBookingAmount', t)} keyboardType="numeric" />
            <CustomInput label="Total Usage Limit *" value={form.usageLimit} onChangeText={t => handleFormChange('usageLimit', t)} keyboardType="numeric" error={formErrors.usageLimit} />
            <CustomInput label="Expiry Date (YYYY-MM-DD) *" value={form.expiryDate} onChangeText={t => handleFormChange('expiryDate', t)} error={formErrors.expiryDate} />

            <View style={{ height: 40 }} />
            <CustomButton title={modalMode === 'create' ? 'Create Code' : 'Save Changes'} onPress={handleSave} loading={submitting} />
          </ScrollView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardInactive: { opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  codeWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.primary + '30' },
  codeText: { color: COLORS.primary, fontSize: SIZES.fontBase, ...FONTS.bold, letterSpacing: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  promoTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 4 },
  description: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 12, borderRadius: SIZES.radiusSm, marginBottom: 8 },
  statBox: { alignItems: 'center' },
  statLabel: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 4 },
  statValue: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold },
  minText: { color: COLORS.textMuted, fontSize: SIZES.fontXs, ...FONTS.medium, marginBottom: 4, fontStyle: 'italic' },
  expiryText: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium, fontStyle: 'italic', textAlign: 'right' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  modalContent: { padding: 20 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 8, marginTop: 4 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  typeBtnTextActive: { color: '#FFF', ...FONTS.bold },
});

export default ManagePromos;

