import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const SEATS_PER_ROW = 8;
const SEAT_AVAILABLE = '#2D3748';
const SEAT_SELECTED = '#22C55E';
const SEAT_UNAVAILABLE = '#EF4444';

const SeatSelector = ({
  totalSeats,
  blockedSeats = [],
  bookedSeats = [],
  selectedSeats = [],
  onToggle,
  maxSelectable = 1,
}) => {
  const unavailableSet = new Set([...blockedSeats, ...bookedSeats]);
  const selectedSet = new Set(selectedSeats);

  const getSeatStatus = (n) => {
    if (unavailableSet.has(n)) return 'unavailable';
    if (selectedSet.has(n)) return 'selected';
    return 'available';
  };

  const rows = [];
  for (let i = 0; i < totalSeats; i += SEATS_PER_ROW) {
    rows.push(
      Array.from({ length: Math.min(SEATS_PER_ROW, totalSeats - i) }, (_, j) => i + j + 1)
    );
  }

  const handlePress = (seatNum) => {
    const status = getSeatStatus(seatNum);
    if (status === 'unavailable') return;
    if (status === 'available' && selectedSeats.length >= maxSelectable) return;
    onToggle(seatNum);
  };

  return (
    <View>
      <View style={styles.legend}>
        <LegendDot color={SEAT_AVAILABLE} label="Available" />
        <LegendDot color={SEAT_SELECTED} label="Selected" />
        <LegendDot color={SEAT_UNAVAILABLE} label="Blocked / Taken" />
      </View>
      <Text style={styles.counter}>
        {selectedSeats.length} / {maxSelectable} seat{maxSelectable !== 1 ? 's' : ''} selected
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((seatNum) => {
                const status = getSeatStatus(seatNum);
                return (
                  <TouchableOpacity
                    key={seatNum}
                    style={[styles.seat, seatColor(status)]}
                    onPress={() => handlePress(seatNum)}
                    activeOpacity={status === 'unavailable' ? 1 : 0.7}
                    disabled={status === 'unavailable'}
                  >
                    <Text style={[styles.seatNum, status === 'selected' && styles.seatNumSelected]}>
                      {seatNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const seatColor = (status) => {
  if (status === 'selected') return { backgroundColor: SEAT_SELECTED };
  if (status === 'unavailable') return { backgroundColor: SEAT_UNAVAILABLE };
  return { backgroundColor: SEAT_AVAILABLE };
};

const LegendDot = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 3 },
  legendLabel: { color: COLORS.textSecondary, fontSize: SIZES.fontXs, ...FONTS.medium },
  counter: {
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSm,
    ...FONTS.bold,
    marginBottom: 12,
  },
  grid: { paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 6 },
  seat: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  seatNum: { color: COLORS.textSecondary, fontSize: 11, ...FONTS.bold },
  seatNumSelected: { color: '#FFF' },
});

export default SeatSelector;
