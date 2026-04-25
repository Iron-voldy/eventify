const express = require('express');
const router = express.Router();
const {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventSeats,
} = require('./eventController');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.route('/')
  .get(getEvents)
  .post(protect, adminOnly, upload.single('eventImage'), createEvent);

router.get('/:id/seats', getEventSeats);

router.route('/:id')
  .get(getEvent)
  .put(protect, adminOnly, upload.single('eventImage'), updateEvent)
  .delete(protect, adminOnly, deleteEvent);

module.exports = router;
