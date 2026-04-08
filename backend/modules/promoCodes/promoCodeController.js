const PromoCode = require('./PromoCode');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get all promo codes (admin)
// @route   GET /api/promo-codes
exports.getPromoCodes = asyncHandler(async (req, res) => {
  const promoCodes = await PromoCode.find().sort('-createdAt');
  res.json({ success: true, count: promoCodes.length, data: promoCodes });
});

// @desc    Get single promo code (admin)
// @route   GET /api/promo-codes/:id
exports.getPromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) {
    res.status(404);
    throw new Error('Promo code not found');
  }
  res.json({ success: true, data: promoCode });
});

// @desc    Create promo code (admin)
// @route   POST /api/promo-codes
exports.createPromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.create(req.body);
  res.status(201).json({ success: true, data: promoCode });
});

// @desc    Update promo code (admin)
// @route   PUT /api/promo-codes/:id
exports.updatePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!promoCode) {
    res.status(404);
    throw new Error('Promo code not found');
  }
  res.json({ success: true, data: promoCode });
});

// @desc    Delete promo code (admin)
// @route   DELETE /api/promo-codes/:id
exports.deletePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) {
    res.status(404);
    throw new Error('Promo code not found');
  }
  await promoCode.deleteOne();
  res.json({ success: true, message: 'Promo code removed' });
});

// @desc    Get active promo codes visible to all logged-in users
// @route   GET /api/promo-codes/active
exports.getActivePromoCodes = asyncHandler(async (req, res) => {
  const now = new Date();
  const promoCodes = await PromoCode.find({
    isActive: true,
    expiryDate: { $gte: now },
  }).sort('-createdAt').select('-__v');
  res.json({ success: true, count: promoCodes.length, data: promoCodes });
});

// @desc    Validate promo code (user)
// @route   POST /api/promo-codes/validate
exports.validatePromoCode = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;

  // Validate inputs
  if (!code) {
    res.status(400);
    throw new Error('Promo code is required');
  }

  const promo = await PromoCode.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiryDate: { $gte: new Date() },
  });

  if (!promo) {
    res.status(400);
    throw new Error('Invalid or expired promo code');
  }

  if (promo.usedCount >= promo.usageLimit) {
    res.status(400);
    throw new Error('Promo code usage limit reached');
  }

  if (amount && amount < promo.minBookingAmount) {
    res.status(400);
    throw new Error(`Minimum booking amount of $${promo.minBookingAmount} required`);
  }

  let discountAmount = 0;
  if (promo.discountType === 'percentage') {
    discountAmount = amount ? (amount * promo.discountValue) / 100 : promo.discountValue;
  } else {
    discountAmount = promo.discountValue;
  }

  res.json({
    success: true,
    data: {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: Math.min(discountAmount, amount || discountAmount),
      description: promo.description,
    },
  });
});
