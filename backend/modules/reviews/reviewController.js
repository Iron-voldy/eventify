const Review = require('./Review');
const Booking = require('../bookings/Booking');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Create review
// @route   POST /api/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { eventId, rating, comment } = req.body;

  // Validate inputs
  if (!eventId || !rating || !comment) {
    res.status(400);
    throw new Error('Event ID, rating and comment are required');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if user has booked this event
  const booking = await Booking.findOne({
    userId: req.user._id,
    eventId,
    bookingStatus: 'confirmed',
  });

  if (!booking) {
    res.status(400);
    throw new Error('You can only review events you have booked');
  }

  // Check for existing review
  const existingReview = await Review.findOne({ userId: req.user._id, eventId });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this event');
  }

  const review = await Review.create({
    userId: req.user._id,
    eventId,
    rating,
    comment,
    reviewImage: req.file ? `/uploads/${req.file.filename}` : '',
  });

  const populated = await Review.findById(review._id).populate('userId', 'fullName profileImage');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get reviews for an event
// @route   GET /api/reviews/event/:eventId
exports.getEventReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    eventId: req.params.eventId,
    status: 'visible',
  })
    .populate('userId', 'fullName profileImage')
    .sort('-reviewDate');

  // Calculate average rating
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  res.json({ success: true, count: reviews.length, avgRating: parseFloat(avgRating), data: reviews });
});

// @desc    Get my reviews
// @route   GET /api/reviews/my
exports.getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ userId: req.user._id })
    .populate('eventId', 'title eventImage')
    .sort('-reviewDate');
  res.json({ success: true, count: reviews.length, data: reviews });
});

// @desc    Update review (own)
// @route   PUT /api/reviews/:id
exports.updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  const { rating, comment, removeReviewImage } = req.body;

  if (rating !== undefined) {
    if (Number(rating) < 1 || Number(rating) > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }
    review.rating = Number(rating);
  }

  if (comment !== undefined) {
    if (!String(comment).trim()) {
      res.status(400);
      throw new Error('Comment cannot be empty');
    }
    review.comment = comment;
  }

  if (req.file) {
    review.reviewImage = `/uploads/${req.file.filename}`;
  } else if (removeReviewImage === 'true' || removeReviewImage === true) {
    review.reviewImage = '';
  }

  await review.save();
  review = await Review.findById(req.params.id).populate('userId', 'fullName profileImage');

  res.json({ success: true, data: review });
});

// @desc    Delete review (own)
// @route   DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }
  await review.deleteOne();
  res.json({ success: true, message: 'Review removed' });
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('userId', 'fullName email')
    .populate('eventId', 'title')
    .sort('-reviewDate');
  res.json({ success: true, count: reviews.length, data: reviews });
});

// @desc    Toggle review visibility (admin)
// @route   PUT /api/reviews/:id/toggle
exports.toggleReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  review.status = review.status === 'visible' ? 'hidden' : 'visible';
  await review.save();
  res.json({ success: true, data: review });
});
