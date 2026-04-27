const crypto = require('crypto');
const Booking = require('../bookings/Booking');
const Event = require('../events/Event');
const PromoCode = require('../promoCodes/PromoCode');
const asyncHandler = require('../../utils/asyncHandler');
const QRCode = require('qrcode');
const { sendBookingConfirmationEmail } = require('../../utils/emailService');

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1221688';
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'MjMwNjk5NTM2OTE3MDMyMTY1ODc3NjMxNjM5MDAyNTQ3ODk3MTY1';
const PAYHERE_SANDBOX_URL = 'https://sandbox.payhere.lk/pay/checkout';

const getBackendUrl = () => (process.env.BACKEND_URL || '').replace(/\/$/, '');

const getPayHereUrls = () => {
  const backendUrl = getBackendUrl();
  return {
    returnUrl: process.env.PAYHERE_RETURN_URL || (backendUrl ? `${backendUrl}/api/payments/return` : ''),
    cancelUrl: process.env.PAYHERE_CANCEL_URL || (backendUrl ? `${backendUrl}/api/payments/cancel` : ''),
    notifyUrl: process.env.PAYHERE_NOTIFY_URL || (backendUrl ? `${backendUrl}/api/payments/notify` : ''),
  };
};

const escapeHtmlAttr = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const generateHash = (orderId, amount, currency = 'LKR') => {
  const amountStr = parseFloat(amount).toFixed(2);
  const secretHash = crypto.createHash('md5')
    .update(MERCHANT_SECRET)
    .digest('hex')
    .toUpperCase();
  const hashInput = `${MERCHANT_ID}${orderId}${amountStr}${currency}${secretHash}`;
  const hash = crypto.createHash('md5').update(hashInput).digest('hex').toUpperCase();
  console.log('[PayHere] Hash generation:');
  console.log('  merchant_id  :', MERCHANT_ID);
  console.log('  order_id     :', orderId);
  console.log('  amount       :', amountStr);
  console.log('  currency     :', currency);
  console.log('  secret_md5   :', secretHash);
  console.log('  hash_input   :', hashInput);
  console.log('  hash         :', hash);
  return hash;
};

const verifyNotifyHash = (body) => {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;
  const secretHash = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
  const localSig = crypto.createHash('md5')
    .update(`${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`)
    .digest('hex')
    .toUpperCase();
  return localSig === md5sig;
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
    throw Object.assign(new Error(`Only ${assigned.length} seats available`), { status: 400 });
  }
  return assigned;
};

// @desc    Initiate PayHere payment — creates pending booking + returns PayHere params
// @route   POST /api/payments/initiate
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { eventId, quantity, promoCode, seatNumbers: rawSeats } = req.body;
  const parsedQuantity = Number(quantity);

  if (!eventId) { res.status(400); throw new Error('Event ID is required'); }
  if (!parsedQuantity || parsedQuantity < 1) { res.status(400); throw new Error('Quantity must be a positive number'); }

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
      throw new Error(`Minimum booking amount of LKR ${promo.minBookingAmount} required`);
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

  const seatNumbers = resolveSeatNumbers(rawSeats);
  let assignedSeats;
  try {
    assignedSeats = await allocateSeats(event, parsedQuantity, seatNumbers.length > 0 ? seatNumbers : null);
  } catch (err) {
    res.status(err.status || 400);
    throw err;
  }

  // Create pending booking (confirmed by PayHere notify or manual confirm)
  const booking = await Booking.create({
    userId: req.user._id,
    eventId,
    quantity: parsedQuantity,
    totalAmount,
    discountAmount,
    finalAmount,
    bookingStatus: 'pending',
    paymentMethod: 'online',
    paymentStatus: 'pending_verification',
    promoCodeId,
    seatNumbers: assignedSeats,
  });

  event.availableSeats -= parsedQuantity;
  await event.save();

  const orderId = booking._id.toString();
  const hash = generateHash(orderId, finalAmount);
  const { returnUrl, cancelUrl, notifyUrl } = getPayHereUrls();
  const nameParts = (req.user.fullName || 'Customer User').split(' ');

  console.log('[PayHere] return_url:', returnUrl);
  console.log('[PayHere] cancel_url:', cancelUrl);
  console.log('[PayHere] notify_url:', notifyUrl);

  const payhereParams = {
    merchant_id: MERCHANT_ID,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    order_id: orderId,
    items: `Event Ticket - ${event.title}`,
    currency: 'LKR',
    amount: parseFloat(finalAmount).toFixed(2),
    first_name: nameParts[0] || 'Customer',
    last_name: nameParts.slice(1).join(' ') || 'User',
    email: req.user.email,
    phone: req.user.phoneNumber || '0771234567',
    address: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash,
  };

  console.log('[PayHere] Params sent to frontend:', JSON.stringify(payhereParams, null, 2));
  res.status(201).json({
    success: true,
    data: { bookingId: booking._id, payhereCheckoutUrl: PAYHERE_SANDBOX_URL, payhereParams },
  });
});

// @desc    PayHere server-to-server payment notification
// @route   POST /api/payments/notify
exports.paymentNotify = async (req, res) => {
  try {
    console.log('[PayHere] Notify received:', JSON.stringify(req.body, null, 2));
    if (!verifyNotifyHash(req.body)) {
      console.log('[PayHere] Notify hash verification FAILED');
      return res.status(400).send('Invalid hash');
    }
    console.log('[PayHere] Notify hash verified OK');

    const { order_id, payment_id, status_code } = req.body;
    const booking = await Booking.findById(order_id)
      .populate('userId', 'fullName email')
      .populate('eventId', 'title eventDate location ticketPrice eventImage');

    if (!booking) return res.status(404).send('Booking not found');

    if (status_code === '2' && booking.paymentStatus === 'pending_verification') {
      booking.paymentStatus = 'completed';
      booking.bookingStatus = 'confirmed';
      booking.paymentReference = payment_id || '';
      await booking.save();

      try {
        const qrBuffer = await QRCode.toBuffer(booking._id.toString(), {
          type: 'png', width: 300, margin: 2,
          color: { dark: '#1a0035', light: '#ffffff' },
        });
        await sendBookingConfirmationEmail({
          to: booking.userId.email,
          userName: booking.userId.fullName,
          booking,
          event: booking.eventId,
          qrBuffer,
        });
      } catch (e) {
        console.error('Email after PayHere notify failed:', e.message);
      }
    } else if (['-1', '-2', '-3'].includes(String(status_code))) {
      if (booking.bookingStatus !== 'cancelled') {
        booking.paymentStatus = 'rejected';
        booking.bookingStatus = 'cancelled';
        await booking.save();
        const event = await Event.findById(booking.eventId._id || booking.eventId);
        if (event) { event.availableSeats += booking.quantity; await event.save(); }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('PayHere notify error:', err.message);
    res.status(500).send('Error');
  }
};

// @desc    Confirm payment from app after PayHere success redirect
// @route   PUT /api/payments/confirm/:bookingId
exports.confirmPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('userId', 'fullName email')
    .populate('eventId', 'title eventDate location ticketPrice eventImage');

  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (booking.userId._id.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }

  if (booking.paymentStatus === 'pending_verification') {
    booking.paymentStatus = 'completed';
    booking.bookingStatus = 'confirmed';
    await booking.save();

    try {
      const qrBuffer = await QRCode.toBuffer(booking._id.toString(), {
        type: 'png', width: 300, margin: 2,
        color: { dark: '#1a0035', light: '#ffffff' },
      });
      await sendBookingConfirmationEmail({
        to: booking.userId.email,
        userName: booking.userId.fullName,
        booking,
        event: booking.eventId,
        qrBuffer,
      });
    } catch (e) {
      console.error('Confirmation email failed:', e.message);
    }
  }

  res.json({ success: true, data: booking });
});

// @desc    Serve PayHere checkout HTML from the server so origin = server IP (not null)
// @route   GET /api/payments/webview/:bookingId
exports.paymentWebView = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('userId', 'fullName email phoneNumber')
    .populate('eventId', 'title');

  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  const orderId = booking._id.toString();
  const hash = generateHash(orderId, booking.finalAmount);
  const nameParts = (booking.userId.fullName || 'Customer User').split(' ');
  const { returnUrl, cancelUrl, notifyUrl } = getPayHereUrls();

  const params = {
    merchant_id: MERCHANT_ID,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    order_id: orderId,
    items: `Event Ticket - ${booking.eventId?.title || 'Event'}`,
    currency: 'LKR',
    amount: parseFloat(booking.finalAmount).toFixed(2),
    first_name: nameParts[0] || 'Customer',
    last_name: nameParts.slice(1).join(' ') || 'User',
    email: booking.userId.email,
    phone: booking.userId.phoneNumber || '0771234567',
    address: 'Sri Lanka',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash,
  };

  const fields = Object.entries(params)
    .map(([k, v]) => `<input type="hidden" name="${escapeHtmlAttr(k)}" value="${escapeHtmlAttr(v)}" />`)
    .join('\n    ');

  console.log('[PayHere] Serving webview form for booking:', orderId);
  console.log('[PayHere] Webview return_url:', returnUrl);
  console.log('[PayHere] Webview cancel_url:', cancelUrl);
  console.log('[PayHere] Webview notify_url:', notifyUrl);

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0E1A; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; font-family: -apple-system, sans-serif; }
    .spinner { width: 48px; height: 48px; border: 4px solid #1F2937; border-top-color: #8B5CF6; border-radius: 50%; animation: spin 0.9s linear infinite; margin-bottom: 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #A78BFA; font-size: 16px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Connecting to PayHere...</p>
  <form id="payhere" method="post" action="${PAYHERE_SANDBOX_URL}" style="display:none">
    ${fields}
  </form>
  <script>
    window.onload = function() {
      setTimeout(function() { document.getElementById('payhere').submit(); }, 600);
    };
  </script>
</body>
</html>`);
});

// @desc    PayHere return URL (success) — browser redirect
// @route   GET /api/payments/return
exports.paymentReturn = (req, res) => {
  res.send(`
    <html><head><title>Payment Success</title></head>
    <body style="background:#0A0E1A;color:#fff;font-family:sans-serif;text-align:center;padding:60px">
      <h2 style="color:#22C55E">&#10003; Payment Successful</h2>
      <p>Your booking is confirmed. You can return to the Eventify app.</p>
    </body></html>
  `);
};

// @desc    PayHere cancel URL — browser redirect
// @route   GET /api/payments/cancel
exports.paymentCancel = (req, res) => {
  res.send(`
    <html><head><title>Payment Cancelled</title></head>
    <body style="background:#0A0E1A;color:#fff;font-family:sans-serif;text-align:center;padding:60px">
      <h2 style="color:#EF4444">Payment Cancelled</h2>
      <p>Your payment was not completed. You can return to the Eventify app and try again.</p>
    </body></html>
  `);
};
