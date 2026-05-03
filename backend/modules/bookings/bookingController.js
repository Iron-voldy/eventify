const Booking = require('./Booking');
const Event = require('../events/Event');
const PromoCode = require('../promoCodes/PromoCode');
const asyncHandler = require('../../utils/asyncHandler');
const QRCode = require('qrcode');
const { sendBookingConfirmationEmail } = require('../../utils/emailService');

const isAdminOrOwner = (booking, user) =>
  booking.userId.toString() === user._id.toString() || user.role === 'admin';

const restoreEventSeats = async (booking) => {
  const event = await Event.findById(booking.eventId);
  if (event) {
    event.availableSeats += booking.quantity;
    await event.save();
  }
};

const restorePromoUsage = async (booking) => {
  if (!booking.promoCodeId) return;

  const promo = await PromoCode.findById(booking.promoCodeId);
  if (promo && promo.usedCount > 0) {
    promo.usedCount -= 1;
    await promo.save();
  }
};

const sendConfirmedBookingEmail = async (booking, user) => {
  const populatedBooking = await Booking.findById(booking._id)
    .populate('eventId', 'title eventDate location ticketPrice eventImage')
    .populate('userId', 'fullName email');

  const qrBuffer = await QRCode.toBuffer(booking._id.toString(), {
    type: 'png',
    width: 300,
    margin: 2,
    color: { dark: '#1a0035', light: '#ffffff' },
  });

  await sendBookingConfirmationEmail({
    to: user.email,
    userName: user.fullName || user.email,
    booking: populatedBooking,
    event: populatedBooking.eventId,
    qrBuffer,
  });
};

// @desc    Create booking
// @route   POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const {
    eventId,
    quantity,
    promoCode,
    paymentMethod = 'online',
    paymentReference,
    paymentAccountName,
  } = req.body;
  const parsedQuantity = Number(quantity);

  // Validate inputs
  if (!eventId) {
    res.status(400);
    throw new Error('Event ID is required');
  }

  if (!parsedQuantity || parsedQuantity < 1 || !Number.isInteger(parsedQuantity)) {
    res.status(400);
    throw new Error('Quantity must be a positive whole number');
  }

  if (!['online', 'bank_transfer'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('Payment method must be online or bank transfer');
  }

  if (paymentMethod === 'online') {
    if (!paymentReference || paymentReference.trim().length < 6) {
      res.status(400);
      throw new Error('A valid online payment reference is required');
    }
    if (!paymentAccountName || paymentAccountName.trim().length < 3) {
      res.status(400);
      throw new Error('Payer name is required for online payments');
    }
  }

  if (paymentMethod === 'bank_transfer' && !req.file) {
    res.status(400);
    throw new Error('Bank transfer slip image is required');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (event.status === 'cancelled') {
    res.status(400);
    throw new Error('Cannot book a cancelled event');
  }

  if (event.availableSeats < parsedQuantity) {
    res.status(400);
    throw new Error(`Only ${event.availableSeats} seats available`);
  }

  let totalAmount = event.ticketPrice * parsedQuantity;
  let discountAmount = 0;
  let promoCodeId = null;

  // Apply promo code if provided
  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase(),
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

    if (totalAmount < promo.minBookingAmount) {
      res.status(400);
      throw new Error(`Minimum booking amount of LKR ${promo.minBookingAmount} required for this promo code`);
    }

    if (promo.discountType === 'percentage') {
      discountAmount = (totalAmount * promo.discountValue) / 100;
    } else {
      discountAmount = promo.discountValue;
    }

    discountAmount = Math.min(discountAmount, totalAmount);
    promoCodeId = promo._id;

    // Increment used count
    promo.usedCount += 1;
    await promo.save();
  }

  const finalAmount = totalAmount - discountAmount;

  const booking = await Booking.create({
    userId: req.user._id,
    eventId,
    quantity: parsedQuantity,
    totalAmount,
    discountAmount,
    finalAmount,
    bookingStatus: paymentMethod === 'bank_transfer' ? 'pending' : 'confirmed',
    paymentMethod,
    paymentStatus: paymentMethod === 'bank_transfer' ? 'pending_verification' : 'completed',
    paymentReference: paymentReference ? paymentReference.trim() : '',
    paymentAccountName: paymentAccountName ? paymentAccountName.trim() : '',
    paymentSlipImage: req.file ? `/uploads/${req.file.filename}` : '',
    promoCodeId,
  });

  // Reserve seats immediately to avoid overselling while a transfer is under review.
  event.availableSeats -= parsedQuantity;
  await event.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('eventId', 'title eventDate location ticketPrice eventImage')
    .populate('userId', 'fullName email');

  if (booking.paymentStatus === 'completed') {
    try {
      await sendConfirmedBookingEmail(booking, req.user);
    } catch (emailErr) {
      console.error('Booking email failed (booking still created):', emailErr.message);
    }
  }

  res.status(201).json({ success: true, data: populatedBooking });
});

// @desc    Get my bookings
// @route   GET /api/bookings/my
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id })
    .populate('eventId', 'title eventDate location ticketPrice eventImage status')
    .sort('-bookingDate');
  res.json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Get all bookings (admin)
// @route   GET /api/bookings
exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('eventId', 'title eventDate location eventImage')
    .populate('userId', 'fullName email')
    .populate('verifiedBy', 'fullName email')
    .sort('-bookingDate');
  res.json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (!isAdminOrOwner(booking, req.user)) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  if (booking.bookingStatus === 'cancelled') {
    res.status(400);
    throw new Error('Booking is already cancelled');
  }

  booking.bookingStatus = 'cancelled';
  if (booking.paymentStatus === 'pending_verification') {
    booking.paymentStatus = 'cancelled';
    await restorePromoUsage(booking);
  }
  await booking.save();

  await restoreEventSeats(booking);

  res.json({ success: true, data: booking });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('eventId', 'title eventDate location ticketPrice eventImage')
    .populate('userId', 'fullName email')
    .populate('verifiedBy', 'fullName email');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (!isAdminOrOwner(booking, req.user)) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json({ success: true, data: booking });
});

// @desc    Review bank transfer payment (admin)
// @route   PUT /api/bookings/:id/review-payment
exports.reviewBookingPayment = asyncHandler(async (req, res) => {
  const { action, verificationNote = '' } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('eventId', 'title eventDate location ticketPrice eventImage')
    .populate('userId', 'fullName email');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.paymentMethod !== 'bank_transfer') {
    res.status(400);
    throw new Error('Only bank transfer bookings can be manually reviewed');
  }

  if (!['approve', 'reject'].includes(action)) {
    res.status(400);
    throw new Error('Review action must be approve or reject');
  }

  if (booking.paymentStatus !== 'pending_verification') {
    res.status(400);
    throw new Error('This booking is no longer waiting for payment review');
  }

  booking.verificationNote = verificationNote.trim();
  booking.verifiedBy = req.user._id;
  booking.verifiedAt = new Date();

  if (action === 'approve') {
    booking.paymentStatus = 'completed';
    booking.bookingStatus = 'confirmed';
    await booking.save();

    try {
      await sendConfirmedBookingEmail(booking, booking.userId);
    } catch (emailErr) {
      console.error('Booking approval email failed:', emailErr.message);
    }
  } else {
    booking.paymentStatus = 'rejected';
    booking.bookingStatus = 'cancelled';
    await restorePromoUsage(booking);
    await booking.save();
    await restoreEventSeats(booking);
  }

  res.json({ success: true, data: booking });
});

// @desc    Scan QR code and retrieve full booking + user details (admin)
// @route   GET /api/bookings/scan/:bookingId
exports.scanBookingQR = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('eventId', 'title eventDate location ticketPrice eventImage status category')
    .populate('userId', 'fullName email phoneNumber profileImage');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found for this QR code');
  }

  res.json({ success: true, data: booking });
});
