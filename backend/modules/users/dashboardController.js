const User = require('./User');
const Event = require('../events/Event');
const Booking = require('../bookings/Booking');
const Review = require('../reviews/Review');
const Complaint = require('../complaints/Complaint');
const PromoCode = require('../promoCodes/PromoCode');
const asyncHandler = require('../../utils/asyncHandler');

// @desc    Get dashboard stats (admin)
// @route   GET /api/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalEvents,
    totalBookings,
    totalReviews,
    totalComplaints,
    totalPromoCodes,
    activeEvents,
    confirmedBookings,
    openComplaints,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Event.countDocuments(),
    Booking.countDocuments(),
    Review.countDocuments(),
    Complaint.countDocuments(),
    PromoCode.countDocuments(),
    Event.countDocuments({ status: 'upcoming' }),
    Booking.countDocuments({ bookingStatus: 'confirmed' }),
    Complaint.countDocuments({ status: 'open' }),
    Booking.find()
      .sort('-bookingDate')
      .limit(5)
      .populate('eventId', 'title')
      .populate('userId', 'fullName'),
  ]);

  // Revenue calculation
  const revenue = await Booking.aggregate([
    { $match: { bookingStatus: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } },
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalEvents,
      totalBookings,
      totalReviews,
      totalComplaints,
      totalPromoCodes,
      activeEvents,
      confirmedBookings,
      openComplaints,
      totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
      recentBookings,
    },
  });
});
