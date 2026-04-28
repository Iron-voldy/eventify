const Complaint = require('./Complaint');
const Booking = require('../bookings/Booking');
const Event = require('../events/Event');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Create complaint
// @route   POST /api/complaints
exports.createComplaint = asyncHandler(async (req, res) => {
  const { subject, description, issueType, bookingId, eventId } = req.body;

  // Validate inputs
  if (!subject || !description || !issueType) {
    res.status(400);
    throw new Error('Subject, description and issue type are required');
  }

  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error('Related booking not found');
    }
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('You can only attach your own booking to a complaint');
    }
    req.body.eventId = booking.eventId;
  } else if (eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404);
      throw new Error('Related event not found');
    }
  }

  if (req.file) {
    req.body.complaintImage = `/uploads/${req.file.filename}`;
  }

  req.body.userId = req.user._id;
  const complaint = await Complaint.create(req.body);
  res.status(201).json({ success: true, data: complaint });
});

// @desc    Get my complaints
// @route   GET /api/complaints/my
exports.getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ userId: req.user._id })
    .populate('eventId', 'title')
    .populate('bookingId', 'bookingDate finalAmount')
    .sort('-createdAt');
  res.json({ success: true, count: complaints.length, data: complaints });
});

// @desc    Get all complaints (admin)
// @route   GET /api/complaints
exports.getAllComplaints = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  let query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const complaints = await Complaint.find(query)
    .populate('userId', 'fullName email')
    .populate('eventId', 'title')
    .populate('bookingId', 'bookingDate finalAmount')
    .sort('-createdAt');
  res.json({ success: true, count: complaints.length, data: complaints });
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
exports.getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('userId', 'fullName email')
    .populate('eventId', 'title')
    .populate('bookingId', 'bookingDate finalAmount');
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  res.json({ success: true, data: complaint });
});

// @desc    Update complaint status & response (admin)
// @route   PUT /api/complaints/:id
exports.updateComplaint = asyncHandler(async (req, res) => {
  const { status, adminResponse, priority } = req.body;
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status, adminResponse, priority },
    { new: true, runValidators: true }
  )
    .populate('userId', 'fullName email')
    .populate('eventId', 'title');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  res.json({ success: true, data: complaint });
});

// @desc    Delete own complaint (if open)
// @route   DELETE /api/complaints/:id
exports.deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (req.user.role !== 'admin') {
    if (complaint.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    if (complaint.status !== 'open') {
      res.status(400);
      throw new Error('Can only delete open tickets');
    }
  }

  await complaint.deleteOne();
  res.json({ success: true, message: 'Complaint removed' });
});
