const Event = require('./Event');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get all events
// @route   GET /api/events
exports.getEvents = asyncHandler(async (req, res) => {
  const { category, status, search } = req.query;
  let query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }

  const events = await Event.find(query)
    .populate('createdBy', 'fullName email')
    .populate('venueId', 'name address city capacity')
    .sort('-eventDate');
  res.json({ success: true, count: events.length, data: events });
});

// @desc    Get single event
// @route   GET /api/events/:id
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'fullName email')
    .populate('venueId', 'name address city capacity contactPhone contactEmail facilities venueImage');
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  res.json({ success: true, data: event });
});

// @desc    Create event (admin)
// @route   POST /api/events
exports.createEvent = asyncHandler(async (req, res) => {
  const { title, eventDate, location, organizerName, ticketPrice, totalSeats, category } = req.body;

  // Validate required fields
  if (!title || !eventDate || !location || !organizerName || !category || ticketPrice === undefined || !totalSeats) {
    res.status(400);
    throw new Error('Title, date, location, organizer, category, ticket price and total seats are all required');
  }

  if (Number(ticketPrice) < 0) {
    res.status(400);
    throw new Error('Ticket price cannot be negative');
  }

  if (Number(totalSeats) < 1) {
    res.status(400);
    throw new Error('Total seats must be at least 1');
  }

  req.body.createdBy = req.user._id;
  if (!req.body.availableSeats) {
    req.body.availableSeats = req.body.totalSeats;
  }
  if (req.file) {
    req.body.eventImage = `/uploads/${req.file.filename}`;
  }
  const event = await Event.create(req.body);
  res.status(201).json({ success: true, data: event });
});

// @desc    Update event (admin)
// @route   PUT /api/events/:id
exports.updateEvent = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.eventImage = `/uploads/${req.file.filename}`;
  }
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  res.json({ success: true, data: event });
});

// @desc    Delete event (admin)
// @route   DELETE /api/events/:id
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  await event.deleteOne();
  res.json({ success: true, message: 'Event removed' });
});
