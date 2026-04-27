const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  paymentNotify,
  confirmPayment,
  paymentReturn,
  paymentCancel,
  paymentWebView,
} = require('./paymentController');
const { protect } = require('../../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.post('/notify', paymentNotify);
router.put('/confirm/:bookingId', protect, confirmPayment);
router.get('/webview/:bookingId', paymentWebView);
router.get('/return', paymentReturn);
router.get('/cancel', paymentCancel);

module.exports = router;
