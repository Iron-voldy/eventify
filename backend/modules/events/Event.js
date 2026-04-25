const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: 2000,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['technology', 'music', 'business', 'health', 'education', 'networking', 'workshop', 'conference', 'other'],
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  organizerName: {
    type: String,
    required: [true, 'Organizer name is required'],
    trim: true,
  },
  ticketPrice: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: 0,
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: 1,
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0,
  },
  eventImage: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    default: null,
  },
  seatAllocationMode: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto',
  },
  blockedSeats: {
    type: [Number],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
