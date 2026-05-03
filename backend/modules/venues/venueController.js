const Venue = require('./Venue');
const Event = require('../events/Event');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get all venues
// @route   GET /api/venues
exports.getVenues = asyncHandler(async (req, res) => {
  const { search, city } = req.query;
  let query = {};

  if (city) query.city = { $regex: city, $options: 'i' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const venues = await Venue.find(query).sort('name');
  res.json({ success: true, count: venues.length, data: venues });
});

// @desc    Get single venue
// @route   GET /api/venues/:id
exports.getVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    res.status(404);
    throw new Error('Venue not found');
  }
  res.json({ success: true, data: venue });
});

// @desc    Get events at a venue
// @route   GET /api/venues/:id/events
exports.getVenueEvents = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    res.status(404);
    throw new Error('Venue not found');
  }

  const events = await Event.find({ venueId: req.params.id })
    .populate('createdBy', 'fullName email')
    .sort('-eventDate');

  res.json({ success: true, count: events.length, data: events });
});

// @desc    Create venue (admin)
// @route   POST /api/venues
exports.createVenue = asyncHandler(async (req, res) => {
  const { name, address, city, capacity } = req.body;

  // Validate required fields
  if (!name || !address || !city || !capacity) {
    res.status(400);
    throw new Error('Name, address, city and capacity are required');
  }

  if (Number(capacity) < 1) {
    res.status(400);
    throw new Error('Capacity must be at least 1');
  }

  if (req.file) {
    req.body.venueImage = `/uploads/${req.file.filename}`;
  }

  const venue = await Venue.create(req.body);
  res.status(201).json({ success: true, data: venue });
});

// @desc    Update venue (admin)
// @route   PUT /api/venues/:id
exports.updateVenue = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.venueImage = `/uploads/${req.file.filename}`;
  }

  const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!venue) {
    res.status(404);
    throw new Error('Venue not found');
  }

  res.json({ success: true, data: venue });
});

// @desc    Delete venue (admin)
// @route   DELETE /api/venues/:id
exports.deleteVenue = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    res.status(404);
    throw new Error('Venue not found');
  }

  // Check if any events use this venue
  const eventCount = await Event.countDocuments({ venueId: req.params.id });
  if (eventCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete venue — it is assigned to ${eventCount} event(s). Update those events first.`);
  }

  await venue.deleteOne();
  res.json({ success: true, message: 'Venue removed' });
});
