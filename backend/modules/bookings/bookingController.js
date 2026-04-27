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

const resolveSeatNumbers = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number);
  try { return JSON.parse(raw).map(Number); } catch { return []; }
};

const allocateSeats = async (event, parsedQuantity, seatNumbers) => {
  const eventId = event._id;

  if (event.seatAllocationMode === 'manual') {
    if (!seatNumbers || seatNumbers.length !== parsedQuantity) {
      throw Object.assign(new Error(`Please select exactly ${parsedQuantity} seat(s)`), { status: 400 });
    }
    const invalid = seatNumbers.filter(s => s < 1 || s > event.totalSeats);
    if (invalid.length > 0) {
      throw Object.assign(new Error('Invalid seat numbers selected'), { status: 400 });
    }
    const blocked = seatNumbers.filter(s => (event.blockedSeats || []).includes(s));
    if (blocked.length > 0) {
      throw Object.assign(new Error(`Seats ${blocked.join(', ')} are blocked`), { status: 400 });
    }
    const existing = await Booking.find({
      eventId,
      bookingStatus: { $in: ['confirmed', 'pending'] },
      seatNumbers: { $in: seatNumbers },
    });
    if (existing.length > 0) {
      const taken = [...new Set(existing.flatMap(b => b.seatNumbers).filter(s => seatNumbers.includes(s)))];
      throw Object.assign(new Error(`Seats ${taken.join(', ')} are already booked`), { status: 400 });
    }
    return seatNumbers;
  }

  // Auto allocation
  const existing = await Booking.find({
    eventId,
    bookingStatus: { $in: ['confirmed', 'pending'] },
  });
  const bookedSet = new Set(existing.flatMap(b => b.seatNumbers || []));
  const blockedSet = new Set(event.blockedSeats || []);
  const assigned = [];
  for (let i = 1; i <= event.totalSeats && assigned.length < parsedQuantity; i++) {
    if (!bookedSet.has(i) && !blockedSet.has(i)) assigned.push(i);
  }
  if (assigned.length < parsedQuantity) {
    throw Object.assign(new Error(`Only ${assigned.length} seats available for auto allocation`), { status: 400 });
  }
  return assigned;
};

// @desc    Create booking (bank transfer only — online uses /api/payments/initiate)
// @route   POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const {
    eventId,
    quantity,
    promoCode,
    paymentMethod = 'bank_transfer',
    paymentReference,
  } = req.body;
  const parsedQuantity = Number(quantity);

  if (!eventId) { res.status(400); throw new Error('Event ID is required'); }
  if (!parsedQuantity || parsedQuantity < 1 || !Number.isInteger(parsedQuantity)) {
    res.status(400); throw new Error('Quantity must be a positive whole number');
  }
  if (paymentMethod === 'bank_transfer' && !req.file) {
    res.status(400); throw new Error('Bank transfer slip image is required');
  }

  const event = await Event.findById(eventId);
  if (!event) { res.status(404); throw new Error('Event not found'); }
  if (event.status === 'cancelled') { res.status(400); throw new Error('Cannot book a cancelled event'); }
  if (event.availableSeats < parsedQuantity) {
    res.status(400); throw new Error(`Only ${event.availableSeats} seats available`);
  }

  let totalAmount = event.ticketPrice * parsedQuantity;
  let discountAmount = 0;
  let promoCodeId = null;

  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() },
    });
    if (!promo) { res.status(400); throw new Error('Invalid or expired promo code'); }
    if (promo.usedCount >= promo.usageLimit) { res.status(400); throw new Error('Promo code usage limit reached'); }
    if (totalAmount < promo.minBookingAmount) {
      res.status(400);
      throw new Error(`Minimum booking amount of LKR ${promo.minBookingAmount} required for this promo code`);
    }
    discountAmount = promo.discountType === 'percentage'
      ? (totalAmount * promo.discountValue) / 100
      : promo.discountValue;
    discountAmount = Math.min(discountAmount, totalAmount);
    promoCodeId = promo._id;
    promo.usedCount += 1;
    await promo.save();
  }

  const finalAmount = totalAmount - discountAmount;

  // Seat allocation
  const seatNumbers = resolveSeatNumbers(req.body.seatNumbers);
  let assignedSeats;
  try {
    assignedSeats = await allocateSeats(event, parsedQuantity, seatNumbers.length > 0 ? seatNumbers : null);
  } catch (err) {
    res.status(err.status || 400);
    throw err;
  }

  const booking = await Booking.create({
    userId: req.user._id,
    eventId,
    quantity: parsedQuantity,
    totalAmount,
    discountAmount,
    finalAmount,
    bookingStatus: 'pending',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending_verification',
    paymentReference: paymentReference ? paymentReference.trim() : '',
    paymentSlipImage: req.file ? `/uploads/${req.file.filename}` : '',
    promoCodeId,
    seatNumbers: assignedSeats,
  });

  event.availableSeats -= parsedQuantity;
  await event.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('eventId', 'title eventDate location ticketPrice eventImage')
    .populate('userId', 'fullName email');

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
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (!isAdminOrOwner(booking, req.user)) { res.status(403); throw new Error('Not authorized to cancel this booking'); }
  if (booking.bookingStatus === 'cancelled') { res.status(400); throw new Error('Booking is already cancelled'); }

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
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (!isAdminOrOwner(booking, req.user)) { res.status(403); throw new Error('Not authorized to view this booking'); }
  res.json({ success: true, data: booking });
});

// @desc    Review bank transfer payment (admin)
// @route   PUT /api/bookings/:id/review-payment
exports.reviewBookingPayment = asyncHandler(async (req, res) => {
  const { action, verificationNote = '' } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('eventId', 'title eventDate location ticketPrice eventImage')
    .populate('userId', 'fullName email');

  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (booking.paymentMethod !== 'bank_transfer') {
    res.status(400); throw new Error('Only bank transfer bookings can be manually reviewed');
  }
  if (!['approve', 'reject'].includes(action)) {
    res.status(400); throw new Error('Review action must be approve or reject');
  }
  if (booking.paymentStatus !== 'pending_verification') {
    res.status(400); throw new Error('This booking is no longer waiting for payment review');
  }

  booking.verificationNote = verificationNote.trim();
  booking.verifiedBy = req.user._id;
  booking.verifiedAt = new Date();

  if (action === 'approve') {
    booking.paymentStatus = 'completed';
    booking.bookingStatus = 'confirmed';
    await booking.save();
    try { await sendConfirmedBookingEmail(booking, booking.userId); } catch (e) {
      console.error('Booking approval email failed:', e.message);
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

// @desc    Scan QR code (admin)
// @route   GET /api/bookings/scan/:bookingId
exports.scanBookingQR = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('eventId', 'title eventDate location ticketPrice eventImage status category')
    .populate('userId', 'fullName email phoneNumber profileImage');
  if (!booking) { res.status(404); throw new Error('Booking not found for this QR code'); }
  res.json({ success: true, data: booking });
});
