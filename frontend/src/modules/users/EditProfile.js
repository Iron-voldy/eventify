import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { API_URL } from '../../constants/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

const EditProfile = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    const trimName = form.fullName.trim();
    const trimPhone = form.phoneNumber.trim();
    if (!trimName) newErrors.fullName = 'Full name is required';
    else if (trimName.length < 2) newErrors.fullName = 'Name must be at least 2 characters';
    else if (trimName.length > 50) newErrors.fullName = 'Name must be 50 characters or fewer';
    if (trimPhone && !PHONE_REGEX.test(trimPhone)) newErrors.phoneNumber = 'Enter a valid phone number (e.g. +94771234567)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await userAPI.updateProfile({ fullName: form.fullName.trim(), phoneNumber: form.phoneNumber.trim() });
      await updateUser(res.data);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to update your profile image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri, result.assets[0].fileName || 'profile.jpg', result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const uploadImage = async (uri, name, type) => {
    try {
      setImageLoading(true);
      const formData = new FormData();
      formData.append('profileImage', { uri, name, type });
      
      const res = await userAPI.updateProfileImage(formData);
      await updateUser(res.data);
      Alert.alert('Success', 'Profile image updated');
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Could not upload image');
    } finally {
      setImageLoading(false);
    }
  };

  const imageSource = user?.profileImage
    ? { uri: user.profileImage.startsWith('http') ? user.profileImage : `${API_URL}${user.profileImage}` }
    : null;

  return (
    <ScreenWrapper keyboard>
      <View style={styles.imageContainer}>
        <View style={[styles.avatarWrap, SHADOWS.medium]}>
          {imageSource ? (
            <Image source={imageSource} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{(user?.fullName || 'U')[0].toUpperCase()}</Text>
            </View>
          )}
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <LoadingSpinner fullScreen={false} />
            </View>
          )}
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} disabled={imageLoading}>
            <Ionicons name="camera" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.form}>
        <CustomInput
          label="Full Name *"
          placeholder="Your full name"
          value={form.fullName}
          onChangeText={(t) => handleChange('fullName', t)}
          error={errors.fullName}
          icon={<Ionicons name="person-outline" size={20} color={COLORS.textMuted} />}
        />
        <CustomInput
          label="Phone Number"
          placeholder="+94771234567"
          value={form.phoneNumber}
          onChangeText={(t) => handleChange('phoneNumber', t)}
          keyboardType="phone-pad"
          error={errors.phoneNumber}
          icon={<Ionicons name="call-outline" size={20} color={COLORS.textMuted} />}
        />
        <CustomInput
          label="Email Address"
          value={user?.email}
          editable={false}
          icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.border} />}
          inputStyle={{ color: COLORS.textMuted }}
        />
      </View>

      <CustomButton
        title="Save Changes"
        onPress={handleSave}
        loading={loading}
        style={styles.saveBtn}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  imageContainer: { alignItems: 'center', marginVertical: 32 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarInitials: { color: '#FFF', fontSize: 48, ...FONTS.bold },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.background },
  emailText: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, ...FONTS.bold, marginBottom: 4 },
  roleText: { color: COLORS.textMuted, fontSize: SIZES.fontSm, ...FONTS.medium, letterSpacing: 1 },
  form: { marginBottom: 32 },
  saveBtn: { marginTop: 16, height: 56 },
});

export default EditProfile;
