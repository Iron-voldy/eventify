const express = require('express');
const router = express.Router();
const {
  createReview, getEventReviews, getMyReviews,
  updateReview, deleteReview, getAllReviews, toggleReviewVisibility,
} = require('./reviewController');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.post('/', protect, upload.single('reviewImage'), createReview);
router.get('/my', protect, getMyReviews);
router.get('/event/:eventId', getEventReviews);
router.get('/', protect, adminOnly, getAllReviews);
router.put('/:id', protect, upload.single('reviewImage'), updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/toggle', protect, adminOnly, toggleReviewVisibility);

module.exports = router;
