const express = require('express');
const router = express.Router();
const {
  getPromoCodes, getPromoCode, createPromoCode,
  updatePromoCode, deletePromoCode, validatePromoCode,
  getActivePromoCodes,
} = require('./promoCodeController');
const { protect, adminOnly } = require('../../middleware/auth');

router.get('/active', protect, getActivePromoCodes);
router.post('/validate', protect, validatePromoCode);

router.route('/')
  .get(protect, adminOnly, getPromoCodes)
  .post(protect, adminOnly, createPromoCode);

router.route('/:id')
  .get(protect, adminOnly, getPromoCode)
  .put(protect, adminOnly, updatePromoCode)
  .delete(protect, adminOnly, deletePromoCode);

module.exports = router;
