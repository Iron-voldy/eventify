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