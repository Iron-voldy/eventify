const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('./wishlistController');
const { protect } = require('../../middleware/auth');

router.get('/', protect, getWishlist);
router.post('/toggle/:eventId', protect, toggleWishlist);

module.exports = router;
