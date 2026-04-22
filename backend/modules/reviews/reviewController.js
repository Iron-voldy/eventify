const Review = require('./Review');
const asyncHandler = require('../../utils/asyncHandler');

// CREATE REVIEW
exports.createReview = asyncHandler(async (req, res) => {
  const { eventId, rating, comment, userId } = req.body;

  const finalUserId = req.user ? req.user._id : (userId || 'anonymous');

  if (!eventId || !rating || !comment) {
    res.status(400);
    throw new Error('Event ID, rating and comment are required');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const existingReview = await Review.findOne({ userId: finalUserId, eventId });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this event');
  }

  const review = await Review.create({
    userId: finalUserId,
    eventId,
    rating,
    comment,
    reviewImage: req.file ? `/uploads/${req.file.filename}` : '',
  });

  res.status(201).json({ success: true, data: review });
});

// GET EVENT REVIEWS
exports.getEventReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    eventId: req.params.eventId,
    status: 'visible',
  }).sort('-reviewDate');

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  res.json({
    success: true,
    count: reviews.length,
    avgRating: parseFloat(avgRating),
    data: reviews
  });
});

// GET MY REVIEWS
exports.getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : req.query.userId;

  if (!userId) {
    res.status(400);
    throw new Error('User ID is required');
  }

  const reviews = await Review.find({ userId }).sort('-reviewDate');

  res.json({ success: true, count: reviews.length, data: reviews });
});

// UPDATE REVIEW
exports.updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const currentUserId = req.user ? req.user._id.toString() : req.body.userId;

  if (review.userId.toString() !== currentUserId && (!req.user || req.user.role !== 'admin')) {
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

  res.json({ success: true, data: review });
});

// DELETE REVIEW
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const currentUserId = req.user ? req.user._id.toString() : req.query.userId;

  if (review.userId.toString() !== currentUserId && (!req.user || req.user.role !== 'admin')) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  await review.deleteOne();

  res.json({ success: true, message: 'Review removed' });
});

// GET ALL REVIEWS (ADMIN)
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort('-reviewDate');

  res.json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// TOGGLE VISIBILITY
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