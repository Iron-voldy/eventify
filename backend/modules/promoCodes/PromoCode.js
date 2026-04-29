const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Promo title is required'],
    trim: true,
  },
  promoImage: {
    type: String,
    default: '',
  },
  availability: {
    type: String,
    default: '',
  },
  code: {
    type: String,
    required: [true, 'Promo code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 0,
  },
  minBookingAmount: {
    type: Number,
    default: 0,
  },
  usageLimit: {
    type: Number,
    default: 100,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
