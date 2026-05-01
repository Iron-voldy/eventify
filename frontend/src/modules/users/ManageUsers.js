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
import { userAPI } from '../../services/api';

const EMPTY_FORM = { fullName: '', email: '', password: '', phoneNumber: '', role: 'user', accountStatus: 'active' };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data);
    } catch (error) {
      console.log('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUsers(); }, []));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingUser(null);
    setModalMode('create');
  };

  const openEdit = (user) => {
    setForm({ fullName: user.fullName, email: user.email, password: '', phoneNumber: user.phoneNumber || '', role: user.role, accountStatus: user.accountStatus });
    setEditingUser(user);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditingUser(null); setForm(EMPTY_FORM); setFormErrors({}); };

  const handleFormChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFormErrors(e => ({ ...e, [key]: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    const trimName = form.fullName.trim();
    const trimEmail = form.email.trim();
    const trimPhone = form.phoneNumber.trim();
    if (!trimName) newErrors.fullName = 'Full name is required';
    else if (trimName.length < 2) newErrors.fullName = 'Name must be at least 2 characters';
    if (!trimEmail) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(trimEmail)) newErrors.email = 'Enter a valid email address';
    if (modalMode === 'create') {
      if (!form.password) newErrors.password = 'Password is required';
      else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      else if (!/\d/.test(form.password)) newErrors.password = 'Password must contain at least one number';
    } else if (form.password && form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (trimPhone && !PHONE_REGEX.test(trimPhone)) newErrors.phoneNumber = 'Enter a valid phone number';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await userAPI.create({ ...form, fullName: form.fullName.trim(), email: form.email.trim() });
        setUsers([res.data, ...users]);
      } else {
        const payload = { fullName: form.fullName.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), role: form.role, accountStatus: form.accountStatus };
        if (form.password) payload.password = form.password;
        await userAPI.update(editingUser._id, payload);
        setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...payload } : u));
      }
      closeModal();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = (user) => {
    const isBlocking = user.accountStatus !== 'blocked';
    Alert.alert('Confirm Action', `Are you sure you want to ${isBlocking ? 'block' : 'unblock'} ${user.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isBlocking ? 'Block' : 'Unblock',
        style: isBlocking ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await userAPI.update(user._id, { accountStatus: isBlocking ? 'blocked' : 'active' });
            setUsers(users.map(u => u._id === user._id ? { ...u, accountStatus: isBlocking ? 'blocked' : 'active' } : u));
          } catch (error) {
            Alert.alert('Error', `Could not update user`);
          }
        },
      },
    ]);
  };

  const handleDelete = (user) => {
    Alert.alert('Delete User', `Permanently delete ${user.fullName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userAPI.delete(user._id);
            setUsers(users.filter(u => u._id !== user._id));
          } catch (error) {
            Alert.alert('Error', 'Could not delete user');
          }
        },
      },
    ]);
  };

  const RoleBtn = ({ value }) => (
    <TouchableOpacity
      style={[styles.roleBtn, form.role === value && styles.roleBtnActive]}
      onPress={() => setForm(f => ({ ...f, role: value }))}
    >
      <Text style={[styles.roleBtnText, form.role === value && styles.roleBtnTextActive]}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const StatusBtn = ({ value }) => (
    <TouchableOpacity
      style={[styles.roleBtn, form.accountStatus === value && styles.roleBtnActive]}
      onPress={() => setForm(f => ({ ...f, accountStatus: value }))}
    >
      <Text style={[styles.roleBtnText, form.accountStatus === value && styles.roleBtnTextActive]}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.small]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitials}>{(item.fullName || 'U')[0].toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: item.role === 'admin' ? COLORS.primary + '30' : COLORS.surface }]}>
            <Text style={[styles.tagText, { color: item.role === 'admin' ? COLORS.primary : COLORS.textMuted }]}>{item.role.toUpperCase()}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: item.accountStatus === 'active' ? COLORS.success + '20' : COLORS.error + '20' }]}>
            <Text style={[styles.tagText, { color: item.accountStatus === 'active' ? COLORS.success : COLORS.error }]}>{item.accountStatus.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        {item.role !== 'admin' && (
          <>
            <TouchableOpacity style={styles.iconBtn} onPress={() => toggleUserStatus(item)}>
              <Ionicons name={item.accountStatus === 'active' ? 'lock-closed-outline' : 'lock-open-outline'} size={18} color={item.accountStatus === 'active' ? COLORS.warning : COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Manage Users</Text>
        <CustomButton title="New User" size="sm" icon={<Ionicons name="add" size={16} color="#FFF" />} onPress={openCreate} />
      </View>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={COLORS.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="people" title="No users found" />}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalMode !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalMode === 'create' ? 'Create User' : 'Edit User'}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <CustomInput label="Full Name *" placeholder="John Doe" value={form.fullName} onChangeText={t => handleFormChange('fullName', t)} error={formErrors.fullName} />
            <CustomInput label="Email *" placeholder="user@example.com" value={form.email} onChangeText={t => handleFormChange('email', t)} keyboardType="email-address" autoCapitalize="none" error={formErrors.email} />
            <CustomInput label={modalMode === 'create' ? 'Password *' : 'New Password (leave blank to keep)'} placeholder="••••••••" value={form.password} onChangeText={t => handleFormChange('password', t)} secureTextEntry error={formErrors.password} />
            <CustomInput label="Phone Number" placeholder="+94771234567" value={form.phoneNumber} onChangeText={t => handleFormChange('phoneNumber', t)} keyboardType="phone-pad" error={formErrors.phoneNumber} />

            <Text style={styles.sectionLabel}>Role</Text>
            <View style={styles.optionRow}>
              <RoleBtn value="user" />
              <RoleBtn value="admin" />
            </View>

            {modalMode === 'edit' && (
              <>
                <Text style={styles.sectionLabel}>Account Status</Text>
                <View style={styles.optionRow}>
                  <StatusBtn value="active" />
                  <StatusBtn value="blocked" />
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
            <CustomButton title={modalMode === 'create' ? 'Create User' : 'Save Changes'} onPress={handleSave} loading={submitting} />
          </ScrollView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  pageTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXxl, ...FONTS.bold },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarInitials: { color: '#FFF', fontSize: SIZES.fontXl, ...FONTS.bold },
  info: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: SIZES.fontBase, ...FONTS.bold, marginBottom: 2 },
  email: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginBottom: 8 },
  tags: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: SIZES.radiusSm },
  tagText: { fontSize: SIZES.fontXs, ...FONTS.bold },
  cardActions: { flexDirection: 'column', gap: 6, marginLeft: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold },
  modalContent: { padding: 20 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, ...FONTS.medium, marginBottom: 8, marginTop: 4 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, ...FONTS.medium },
  roleBtnTextActive: { color: '#FFF', ...FONTS.bold },
});

export default ManageUsers;
