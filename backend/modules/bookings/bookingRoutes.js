const express = require('express');
const router = express.Router();
const {
  createBooking, getMyBookings, getAllBookings, cancelBooking, getBooking, scanBookingQR, reviewBookingPayment,
} = require('./bookingController');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.post('/', protect, upload.single('paymentSlipImage'), createBooking);
router.get('/my', protect, getMyBookings);
router.get('/scan/:bookingId', protect, adminOnly, scanBookingQR);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/review-payment', protect, adminOnly, reviewBookingPayment);

module.exports = router;
