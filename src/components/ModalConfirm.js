import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import CustomButton from './CustomButton';

const ModalConfirm = ({
  visible,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={[styles.iconCircle, { backgroundColor: danger ? COLORS.error + '20' : COLORS.primary + '20' }]}>
          <Ionicons
            name={danger ? 'warning' : 'help-circle'}
            size={32}
            color={danger ? COLORS.error : COLORS.primary}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <CustomButton title={cancelText} variant="outline" onPress={onCancel} style={styles.btn} />
          <CustomButton
            title={confirmText}
            variant={danger ? 'danger' : 'primary'}
            onPress={onConfirm}
            style={styles.btn}
          />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXl, ...FONTS.bold, marginBottom: 8, textAlign: 'center' },
  message: { color: COLORS.textSecondary, fontSize: SIZES.fontBase, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1 },
});

export default ModalConfirm;
