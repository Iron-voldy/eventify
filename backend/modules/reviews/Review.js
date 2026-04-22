const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  eventId: {
    type: String,
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
timestamps: true 

});
