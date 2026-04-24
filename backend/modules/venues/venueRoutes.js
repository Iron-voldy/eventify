const express = require('express');
const router = express.Router();
const {
  getVenues, getVenue, getVenueEvents, createVenue, updateVenue, deleteVenue,
} = require('./venueController');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Public routes (all logged-in users)
router.get('/', protect, getVenues);
router.get('/:id', protect, getVenue);
router.get('/:id/events', protect, getVenueEvents);

// Admin-only routes
router.post('/', protect, adminOnly, upload.single('venueImage'), createVenue);
router.put('/:id', protect, adminOnly, upload.single('venueImage'), updateVenue);
router.delete('/:id', protect, adminOnly, deleteVenue);

module.exports = router;
