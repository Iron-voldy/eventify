import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Clipboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { promoAPI } from '../../services/api';

const GRADIENT_PAIRS = [
  ['#7C3AED', '#EC4899'],
  ['#0EA5E9', '#6366F1'],
  ['#10B981', '#0EA5E9'],
  ['#F59E0B', '#EF4444'],
  ['#8B5CF6', '#06B6D4'],
];

const PromoCard = ({ promo, index }) => {
  const gradColors = GRADIENT_PAIRS[index % GRADIENT_PAIRS.length];
  const isExpiringSoon = () => {
    const days = (new Date(promo.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  const formattedExpiry = new Date(promo.expiryDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const discountLabel =
    promo.discountType === 'percentage'
      ? `${promo.discountValue}% OFF`
      : `LKR ${promo.discountValue} OFF`;

  const handleCopy = () => {
    Clipboard.setString(promo.code);
    Alert.alert('Copied!', `Promo code "${promo.code}" copied to clipboard`);
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardHeader}
      >
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountLabel}</Text>
        </View>

        {isExpiringSoon() && (
          <View style={styles.expiringBadge}>
            <MaterialIcons name="access-time" size={11} color="#FFF" />
            <Text style={styles.expiringText}>Expiring Soon</Text>
          </View>
        )}

        <Text style={styles.promoTitle} numberOfLines={1}>{promo.title}</Text>
      </LinearGradient>

      <View style={styles.cardBody}>
        {promo.description ? (
          <Text style={styles.description} numberOfLines={2}>{promo.description}</Text>
        ) : null}

        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>Expires {formattedExpiry}</Text>
        </View>

        {promo.minBookingAmount > 0 && (
          <View style={styles.infoRow}>
            <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>Min booking LKR {promo.minBookingAmount}</Text>
          </View>
        )}

        {promo.availability ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{promo.availability}</Text>
          </View>
        ) : null}

        {/* Code pill + copy */}
        <View style={styles.codeRow}>
          <View style={styles.codePill}>
            <Text style={[styles.codeText, { color: gradColors[0] }]}>{promo.code}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <MaterialIcons name="content-copy" size={16} color="#FFF" />
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Promotions = ({ navigation }) => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPromos = async () => {
    try {
      const res = await promoAPI.getActive();
      setPromos(res.data);
    } catch (err) {
      console.log('Promo fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPromos(); }, []));

  if (loading) return <LoadingSpinner />;

  return (
    <ScreenWrapper scroll={false}>
      <FlatList
        data={promos}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => <PromoCard promo={item} index={index} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {navigation.canGoBack() && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <MaterialIcons name="arrow-back" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            <Text style={styles.pageTitle}>Promotions</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="No promotions available"
            subtitle="Check back later for exciting deals and discounts"
          />
        }
        ListFooterComponent={<View style={{ height: 24 }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPromos(); }}
            tintColor={COLORS.primary}
          />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontXxl,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusMd,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -20,
  },
  circle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: 60,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  discountText: {
    color: '#FFF',
    fontSize: SIZES.fontMd,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expiringBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  expiringText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  promoTitle: {
    color: '#FFF',
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  cardBody: {
    padding: 16,
    gap: 8,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontBase,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
    fontWeight: '500',
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    flex: 1,
    marginRight: 10,
  },
  codeText: {
    fontSize: SIZES.fontMd,
    fontWeight: '800',
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: SIZES.radius,
    gap: 5,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: SIZES.fontSm,
    fontWeight: '700',
  },
});

export default Promotions;
