const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed',
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'bank_transfer'],
    required: true,
    default: 'online',
  },
  paymentStatus: {
    type: String,
    enum: ['completed', 'pending_verification', 'rejected', 'cancelled'],
    required: true,
    default: 'completed',
  },
  paymentReference: {
    type: String,
    trim: true,
    default: '',
    maxlength: 120,
  },
  paymentAccountName: {
    type: String,
    trim: true,
    default: '',
    maxlength: 120,
  },
  paymentSlipImage: {
    type: String,
    default: '',
  },
  verificationNote: {
    type: String,
    trim: true,
    default: '',
    maxlength: 500,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  promoCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
