const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./modules/users/User');
const Event = require('./modules/events/Event');
const PromoCode = require('./modules/promoCodes/PromoCode');
const Booking = require('./modules/bookings/Booking');
const Review = require('./modules/reviews/Review');
const Complaint = require('./modules/complaints/Complaint');

dotenv.config();

const seedOtherData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully!');

    // Fetch user and events
    let user = await User.findOne({ email: 'admin@eventify.com' });
    if (!user) {
      user = await User.findOne(); // grab any user if admin not found
    }
    
    if (!user) {
      console.log('No user found in the database. Please create a user first.');
      process.exit(1);
    }

    const events = await Event.find().limit(5);
    if (events.length < 5) {
      console.log('Not enough events to seed Reviews/Bookings. Please seed events first.');
      process.exit(1);
    }

    // 1. Seed PromoCodes (5)
    console.log('Seeding Promo Codes...');
    const promoCodes = [
      { 
        title: 'Flash Sale 50% Off',
        code: 'SALE50', 
        description: 'Instant 50% discount on all events at checkout', 
        availability: 'Valid till stock lasts',
        promoImage: '/uploads/promo_flash.png',
        discountType: 'percentage', 
        discountValue: 50, 
        expiryDate: new Date('2026-12-31') 
      },
      { 
        title: 'Saturday 30% Offer',
        code: 'SAT30', 
        description: 'for saturday at 10.00 p.m, to 11.p.m we are giving all events for 30% discount', 
        availability: 'Saturday 10PM - 11PM only',
        promoImage: '/uploads/promo_sat30.png',
        discountType: 'percentage', 
        discountValue: 30, 
        expiryDate: new Date('2026-12-31') 
      },
      { 
        title: 'Early Bird VIP',
        code: 'VIP2026', 
        description: 'Special early bird access for premium events', 
        availability: 'First 100 bookings',
        promoImage: '/uploads/promo_earlybird.png',
        discountType: 'fixed', 
        discountValue: 1000, 
        minBookingAmount: 5000, 
        expiryDate: new Date('2026-12-31') 
      },
      { 
        title: 'Welcome Discount',
        code: 'WELCOME10', 
        description: 'Get a 10% discount on your very first booking', 
        availability: 'New users only',
        promoImage: '/uploads/promo_welcome.png',
        discountType: 'percentage', 
        discountValue: 10, 
        expiryDate: new Date('2026-12-31') 
      },
      { 
        title: 'Festival Season Blast',
        code: 'FESTIVAL20', 
        description: 'Huge 20% savings on all participating festival events', 
        availability: 'During festival season',
        promoImage: '/uploads/promo_festival.png',
        discountType: 'percentage', 
        discountValue: 20, 
        expiryDate: new Date('2026-12-31') 
      },
    ];
    await PromoCode.deleteMany({ code: { $in: promoCodes.map(p => p.code) } }); // Clean up if re-running
    const createdPromos = await PromoCode.insertMany(promoCodes);

    // 2. Seed Bookings (5)
    console.log('Seeding Bookings...');
    const bookings = events.map((event, index) => ({
      userId: user._id,
      eventId: event._id,
      quantity: 2,
      totalAmount: event.ticketPrice * 2,
      discountAmount: index === 0 ? 500 : 0, // apply discount to first
      finalAmount: (event.ticketPrice * 2) - (index === 0 ? 500 : 0),
      bookingStatus: 'confirmed',
      promoCodeId: index === 0 ? createdPromos[2]._id : null
    }));
    await Booking.deleteMany({ userId: user._id }); // cleanup previous for this user
    const createdBookings = await Booking.insertMany(bookings);

    // 3. Seed Reviews (5)
    console.log('Seeding Reviews...');
    const reviews = events.map((event, index) => ({
      userId: user._id,
      eventId: event._id,
      rating: [5, 4, 5, 3, 4][index],
      comment: [
        'Absolutely amazing event! Loved the vibe.',
        'Great organization, but the food was a bit expensive.',
        'A wonderful experience. Will definitely attend again.',
        'It was okay. Started a bit late.',
        'The sound system was fantastic!'
      ][index],
      status: 'visible'
    }));
    await Review.deleteMany({ userId: user._id }); // cleanup previous for this user
    await Review.insertMany(reviews);

    // 4. Seed Complaints (5)
    console.log('Seeding Complaints...');
    const complaints = [
      {
        userId: user._id,
        eventId: events[0]._id,
        bookingId: createdBookings[0]._id,
        subject: 'Difficulty finding parking',
        description: 'The location provided did not have clear signs for parking, spent 30 mins looking.',
        issueType: 'event',
        priority: 'medium',
      },
      {
        userId: user._id,
        eventId: events[1]._id,
        bookingId: createdBookings[1]._id,
        subject: 'Payment was deducted twice',
        description: 'My card was charged twice when I was trying to book the ticket. Please refund.',
        issueType: 'payment',
        priority: 'high',
      },
      {
        userId: user._id,
        subject: 'App keeps crashing on checkout',
        description: 'Whenever I try to apply a promo code, the app gets stuck and crashes.',
        issueType: 'technical',
        priority: 'high',
      },
      {
        userId: user._id,
        eventId: events[2]._id,
        bookingId: createdBookings[2]._id,
        subject: 'Did not receive confirmation email',
        description: 'I booked a ticket but have not received the QR code in my email yet.',
        issueType: 'booking',
        priority: 'urgent',
      },
      {
        userId: user._id,
        subject: 'Suggestion for better navigation',
        description: 'It would be great if you could add a map feature within the app to find the venues easier.',
        issueType: 'other',
        priority: 'low',
      }
    ];
    await Complaint.deleteMany({ userId: user._id }); // cleanup previous for this user
    await Complaint.insertMany(complaints);

    console.log('Successfully seeded 5 PromoCodes, Bookings, Reviews, and Complaints!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedOtherData();
