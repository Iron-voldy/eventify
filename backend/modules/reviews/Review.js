const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: 1000,
  },
  reviewImage: {
    type: String,
    default: '',
  },
  reviewDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['visible', 'hidden'],
    default: 'visible',
  },
}, { timestamps: true });

reviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
