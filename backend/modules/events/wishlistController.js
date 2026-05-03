const User = require('../users/User');
const Event = require('./Event');
const asyncHandler = require('../../utils/asyncHandler');

// GET /api/wishlist  — get current user's wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('wishlist');
  const events = await Event.find({ _id: { $in: user.wishlist || [] } });
  res.json({ success: true, count: events.length, data: events });
});

// POST /api/wishlist/toggle/:eventId  — add or remove
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const user = await User.findById(req.user._id).select('wishlist');
  const wishlist = user.wishlist || [];
  const idx = wishlist.findIndex((id) => id.toString() === eventId);

  let added;
  if (idx === -1) {
    wishlist.push(eventId);
    added = true;
  } else {
    wishlist.splice(idx, 1);
    added = false;
  }

  await User.findByIdAndUpdate(req.user._id, { wishlist });
  res.json({ success: true, added, wishlist });
});
