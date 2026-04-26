const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    maxlength: 150,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: 300,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  contactPhone: {
    type: String,
    default: '',
    trim: true,
  },
  contactEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  venueImage: {
    type: String,
    default: '',
  },
  facilities: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Venue', venueSchema);
