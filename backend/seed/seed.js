const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../modules/users/User');
const Event = require('../modules/events/Event');
const Venue = require('../modules/venues/Venue');
const Booking = require('../modules/bookings/Booking');
const Review = require('../modules/reviews/Review');
const Complaint = require('../modules/complaints/Complaint');
const PromoCode = require('../modules/promoCodes/PromoCode');

const venueSeed = [
  {
    key: 'bmich',
    name: 'BMICH Main Hall',
    address: 'Bauddhaloka Mawatha, Colombo 07',
    city: 'Colombo',
    capacity: 1800,
    description: 'A flagship conference venue in Colombo for national summits, exhibitions, and major corporate events.',
    contactPhone: '+94 11 269 1131',
    contactEmail: 'events@bmich.lk',
    venueImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
    facilities: ['Parking', 'Stage Lighting', 'Hybrid Streaming', 'VIP Lounge'],
  },
  {
    key: 'trace',
    name: 'Trace Expert City Auditorium',
    address: 'No. 47, University Road, Colombo 10',
    city: 'Colombo',
    capacity: 420,
    description: 'A modern tech-friendly venue popular for hackathons, startup demos, and digital community meetups.',
    contactPhone: '+94 11 266 6633',
    contactEmail: 'hello@trace.lk',
    venueImage: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
    facilities: ['High-Speed Wi-Fi', 'Projectors', 'Coffee Bar', 'Workshop Rooms'],
  },
  {
    key: 'cinnamon-grand',
    name: 'Cinnamon Grand Oak Room',
    address: '77, Galle Road, Colombo 03',
    city: 'Colombo',
    capacity: 900,
    description: 'A premium ballroom setup ideal for investor forums, gala dinners, and upscale business showcases.',
    contactPhone: '+94 11 249 7373',
    contactEmail: 'events@cinnamonhotels.com',
    venueImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
    facilities: ['Valet Parking', 'In-House Catering', 'LED Wall', 'Breakout Suites'],
  },
  {
    key: 'galle-face',
    name: 'Galle Face Hotel Jubilee Ballroom',
    address: '2, Galle Road, Colombo 03',
    city: 'Colombo',
    capacity: 320,
    description: 'A heritage event space suited for leadership forums, networking dinners, and executive roundtables.',
    contactPhone: '+94 11 254 1010',
    contactEmail: 'jubilee@gallefacehotel.com',
    venueImage: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80',
    facilities: ['Oceanfront Terrace', 'Private Dining', 'Sound System', 'VIP Reception'],
  },
  {
    key: 'earls-regency',
    name: "Earl's Regency Grand Ballroom",
    address: 'Kundasale, Kandy',
    city: 'Kandy',
    capacity: 600,
    description: 'A spacious hill-country venue often used for educational summits, hospitality events, and conventions.',
    contactPhone: '+94 81 242 2122',
    contactEmail: 'events@earlsregency.com',
    venueImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    facilities: ['Parking', 'Garden Access', 'Buffet Service', 'Conference AV'],
  },
  {
    key: 'jetwing-blue',
    name: 'Jetwing Blue Conference Suite',
    address: 'Ethukala, Negombo',
    city: 'Negombo',
    capacity: 750,
    description: 'A beachfront venue for music nights, tourism events, and destination brand activations.',
    contactPhone: '+94 31 227 3500',
    contactEmail: 'events@jetwinghotels.com',
    venueImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    facilities: ['Beach Access', 'Outdoor Stage', 'Bar Service', 'Artist Green Room'],
  },
  {
    key: 'amari-galle',
    name: 'Amari Galle Bay Event Terrace',
    address: '523C, Colombo Road, Gintota, Galle',
    city: 'Galle',
    capacity: 260,
    description: 'A scenic southern coastal venue built for networking mixers, travel showcases, and creative socials.',
    contactPhone: '+94 91 203 4000',
    contactEmail: 'events.galle@amari.com',
    venueImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
    facilities: ['Sea View Deck', 'Live Music Setup', 'Cocktail Service', 'Private Lounge'],
  },
  {
    key: 'jaffna-cultural',
    name: 'Jaffna Cultural Centre Auditorium',
    address: 'Clock Tower Road, Jaffna',
    city: 'Jaffna',
    capacity: 500,
    description: 'A prominent northern venue for public forums, youth programs, and regional innovation gatherings.',
    contactPhone: '+94 21 222 8877',
    contactEmail: 'auditorium@jcc.lk',
    venueImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    facilities: ['Auditorium Seating', 'Backstage Rooms', 'Digital Display', 'Security Desk'],
  },
  {
    key: 'grand-nuwara',
    name: 'Grand Hotel Highland Hall',
    address: 'Grand Hotel Road, Nuwara Eliya',
    city: 'Nuwara Eliya',
    capacity: 180,
    description: 'A cool-climate retreat venue suitable for wellness sessions, intimate workshops, and premium retreats.',
    contactPhone: '+94 52 222 8811',
    contactEmail: 'highlandhall@grandhotel.lk',
    venueImage: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    facilities: ['Tea Lounge', 'Garden Access', 'Heated Indoor Hall', 'Healthy Catering'],
  },
];

const eventSeed = [
  {
    title: 'Colombo Tech Summit 2026',
    description: 'A full-day summit focused on AI product delivery, cloud platforms, and digital public services, featuring Sri Lankan founders, engineering leaders, and product teams.',
    category: 'technology',
    eventDate: new Date('2026-05-28'),
    startTime: '09:00 AM',
    endTime: '05:30 PM',
    organizerName: 'Lanka Digital Forum',
    ticketPrice: 8500,
    totalSeats: 700,
    availableSeats: 642,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    venueKey: 'bmich',
  },
  {
    title: 'Negombo Sunset Music Festival',
    description: 'An energetic coastal music experience with Sri Lankan bands, guest DJs, beach food stalls, and sunset stage performances by the sea.',
    category: 'music',
    eventDate: new Date('2026-06-20'),
    startTime: '04:30 PM',
    endTime: '11:30 PM',
    organizerName: 'WaveLine Entertainment',
    ticketPrice: 6500,
    totalSeats: 1200,
    availableSeats: 1115,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    venueKey: 'jetwing-blue',
  },
  {
    title: 'Sri Lanka Startup Investor Expo',
    description: 'A startup showcase connecting early-stage teams with angel investors, banks, incubators, and growth partners from across the island.',
    category: 'business',
    eventDate: new Date('2026-05-10'),
    startTime: '10:00 AM',
    endTime: '06:00 PM',
    organizerName: 'Founders Lanka',
    ticketPrice: 5500,
    totalSeats: 850,
    availableSeats: 792,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    venueKey: 'cinnamon-grand',
  },
  {
    title: 'Creator Circle Colombo',
    description: 'A community meetup for podcasters, designers, short-form video creators, and brand storytellers with panels on growth, monetization, and production workflows.',
    category: 'networking',
    eventDate: new Date('2026-05-03'),
    startTime: '02:00 PM',
    endTime: '07:00 PM',
    organizerName: 'Creator Circle Sri Lanka',
    ticketPrice: 2500,
    totalSeats: 220,
    availableSeats: 188,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
    venueKey: 'trace',
  },
  {
    title: 'Nuwara Eliya Wellness Reset',
    description: 'A rejuvenating wellness day covering yoga, mindfulness, clean eating, stress management, and guided reflection sessions in the hill country.',
    category: 'health',
    eventDate: new Date('2026-06-06'),
    startTime: '07:30 AM',
    endTime: '04:00 PM',
    organizerName: 'Serene Island Wellness',
    ticketPrice: 4200,
    totalSeats: 120,
    availableSeats: 96,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
    venueKey: 'grand-nuwara',
  },
  {
    title: 'AI in Finance Leadership Forum',
    description: 'A conference for banking, fintech, and operations leaders exploring AI compliance, fraud prevention, customer support automation, and secure deployment.',
    category: 'conference',
    eventDate: new Date('2026-07-12'),
    startTime: '09:30 AM',
    endTime: '05:00 PM',
    organizerName: 'FinTech Colombo Guild',
    ticketPrice: 9000,
    totalSeats: 360,
    availableSeats: 331,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    venueKey: 'galle-face',
  },
  {
    title: 'Southern Tourism Networking Night',
    description: 'An evening mixer for boutique hotels, tour operators, travel creators, and hospitality teams building visitor experiences in southern Sri Lanka.',
    category: 'networking',
    eventDate: new Date('2026-05-17'),
    startTime: '06:00 PM',
    endTime: '10:30 PM',
    organizerName: 'South Coast Connect',
    ticketPrice: 4800,
    totalSeats: 180,
    availableSeats: 149,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    venueKey: 'amari-galle',
  },
  {
    title: 'Mobile App Builder Bootcamp',
    description: 'A practical React Native bootcamp covering architecture, APIs, debugging, deployment, and portfolio-ready mobile app development for local teams.',
    category: 'workshop',
    eventDate: new Date('2026-05-24'),
    startTime: '09:00 AM',
    endTime: '05:30 PM',
    organizerName: 'CodeWave Academy',
    ticketPrice: 7200,
    totalSeats: 160,
    availableSeats: 121,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&q=80',
    venueKey: 'trace',
  },
  {
    title: 'Design Thinking for Hospitality',
    description: 'A hands-on masterclass for hotel managers, service designers, and founders who want to improve guest experience through design thinking.',
    category: 'education',
    eventDate: new Date('2026-06-14'),
    startTime: '10:00 AM',
    endTime: '04:30 PM',
    organizerName: 'Service Design Lanka',
    ticketPrice: 3900,
    totalSeats: 140,
    availableSeats: 112,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80',
    venueKey: 'earls-regency',
  },
  {
    title: 'Northern Digital Careers Forum',
    description: 'A regional tech careers event with recruiter booths, portfolio reviews, freelancing panels, and talks on digital work opportunities for youth in the North.',
    category: 'technology',
    eventDate: new Date('2026-07-04'),
    startTime: '09:30 AM',
    endTime: '04:30 PM',
    organizerName: 'Digital North Collective',
    ticketPrice: 1500,
    totalSeats: 300,
    availableSeats: 266,
    status: 'upcoming',
    eventImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    venueKey: 'jaffna-cultural',
  },
];

const promoCodeSeed = [
  {
    title: 'Welcome Saver 15%',
    code: 'WELCOME15',
    description: '15% off for first-time bookings',
    availability: 'New users only',
    promoImage: '/uploads/promo_welcome15.png',
    discountType: 'percentage',
    discountValue: 15,
    minBookingAmount: 2500,
    usageLimit: 500,
    usedCount: 42,
    expiryDate: new Date('2026-12-31'),
    isActive: true,
  },
  {
    title: 'Tech Event LKR 1500 Off',
    code: 'TECH1500',
    description: 'LKR 1,500 off selected technology and conference events',
    availability: 'Valid on selected tech and conference bookings',
    promoImage: '/uploads/promo_tech1500.png',
    discountType: 'fixed',
    discountValue: 1500,
    minBookingAmount: 6000,
    usageLimit: 200,
    usedCount: 19,
    expiryDate: new Date('2026-08-31'),
    isActive: true,
  },
  {
    title: 'Early Bird 10%',
    code: 'EARLY10',
    description: '10% early bird savings on any event',
    availability: 'Available until allocation is fully claimed',
    promoImage: '/uploads/promo_early10.png',
    discountType: 'percentage',
    discountValue: 10,
    minBookingAmount: 0,
    usageLimit: 1000,
    usedCount: 118,
    expiryDate: new Date('2026-09-30'),
    isActive: true,
  },
  {
    title: 'Weekend Special 20%',
    code: 'WEEKEND20',
    description: '20% off selected weekend events',
    availability: 'Weekend events only',
    promoImage: '/uploads/promo_weekend20.png',
    discountType: 'percentage',
    discountValue: 20,
    minBookingAmount: 3000,
    usageLimit: 250,
    usedCount: 27,
    expiryDate: new Date('2026-07-31'),
    isActive: true,
  },
  {
    title: 'Lanka Booking LKR 500 Off',
    code: 'LANKA500',
    description: 'LKR 500 off general admission bookings',
    availability: 'Available on standard ticket purchases',
    promoImage: '/uploads/promo_lanka500.png',
    discountType: 'fixed',
    discountValue: 500,
    minBookingAmount: 2000,
    usageLimit: 350,
    usedCount: 76,
    expiryDate: new Date('2026-10-15'),
    isActive: true,
  },
  {
    title: 'Expired Flash 25%',
    code: 'EXPIRED25',
    description: 'Expired 25% flash sale for archive testing',
    availability: 'Expired test promo',
    promoImage: '/uploads/promo_expired25.png',
    discountType: 'percentage',
    discountValue: 25,
    minBookingAmount: 0,
    usageLimit: 50,
    usedCount: 50,
    expiryDate: new Date('2025-12-31'),
    isActive: false,
  },
];

const buildVenueMap = (insertedVenues) =>
  insertedVenues.reduce((acc, venue, index) => {
    acc[venueSeed[index].key] = venue;
    return acc;
  }, {});

const venueLocationLabel = (venue) => `${venue.name}, ${venue.city}`;

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    await Promise.all([
      Booking.deleteMany(),
      Review.deleteMany(),
      Complaint.deleteMany(),
      PromoCode.deleteMany(),
      Event.deleteMany(),
      Venue.deleteMany(),
      User.deleteMany(),
    ]);
    console.log('Existing data cleared.');

    const admin = await User.create({
      fullName: 'Kasun Perera',
      email: 'admin@eventify.com',
      password: 'admin123',
      phoneNumber: '+94 77 345 6789',
      role: 'admin',
      accountStatus: 'active',
    });

    const sharedUserPasswordHash = await bcrypt.hash('password123', 12);

    const users = await User.insertMany([
      {
        fullName: 'Nadeesha Silva',
        email: 'hasindut1@gmail.com',
        password: sharedUserPasswordHash,
        phoneNumber: '+94 71 234 5678',
        role: 'user',
        accountStatus: 'active',
      },
      {
        fullName: 'Thisara Fernando',
        email: 'thisara.fernando@gmail.com',
        password: sharedUserPasswordHash,
        phoneNumber: '+94 76 345 6789',
        role: 'user',
        accountStatus: 'active',
      },
      {
        fullName: 'Dilani Jayasuriya',
        email: 'dilani.j@gmail.com',
        password: sharedUserPasswordHash,
        phoneNumber: '+94 75 456 7890',
        role: 'user',
        accountStatus: 'active',
      },
      {
        fullName: 'Charith Wickramasinghe',
        email: 'charith.w@gmail.com',
        password: sharedUserPasswordHash,
        phoneNumber: '+94 70 567 8901',
        role: 'user',
        accountStatus: 'active',
      },
      {
        fullName: 'Amaya Peris',
        email: 'amaya.peris@gmail.com',
        password: sharedUserPasswordHash,
        phoneNumber: '+94 78 678 9012',
        role: 'user',
        accountStatus: 'active',
      },
    ]);

    console.log(`Seeded ${users.length + 1} users (1 admin + ${users.length} users)`);
    console.log('  Admin: admin@eventify.com / admin123');
    console.log('  Users: hasindut1@gmail.com, thisara.fernando@gmail.com, etc. / password123');

    const venues = await Venue.insertMany(
      venueSeed.map(({ key, ...venue }) => venue)
    );
    const venueMap = buildVenueMap(venues);

    console.log(`Seeded ${venues.length} Sri Lankan venues`);

    const events = await Event.insertMany(
      eventSeed.map(({ venueKey, ...event }) => {
        const venue = venueMap[venueKey];

        return {
          ...event,
          location: venueLocationLabel(venue),
          createdBy: admin._id,
          venueId: venue._id,
        };
      })
    );

    console.log(`Seeded ${events.length} venue-linked events`);

    const bookings = await Booking.insertMany([
      {
        userId: users[0]._id,
        eventId: events[0]._id,
        quantity: 2,
        totalAmount: 17000,
        discountAmount: 0,
        finalAmount: 17000,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[1]._id,
        eventId: events[1]._id,
        quantity: 3,
        totalAmount: 19500,
        discountAmount: 1950,
        finalAmount: 17550,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[2]._id,
        eventId: events[2]._id,
        quantity: 1,
        totalAmount: 5500,
        discountAmount: 0,
        finalAmount: 5500,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[0]._id,
        eventId: events[3]._id,
        quantity: 1,
        totalAmount: 2500,
        discountAmount: 0,
        finalAmount: 2500,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[3]._id,
        eventId: events[0]._id,
        quantity: 1,
        totalAmount: 8500,
        discountAmount: 850,
        finalAmount: 7650,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[4]._id,
        eventId: events[4]._id,
        quantity: 2,
        totalAmount: 8400,
        discountAmount: 0,
        finalAmount: 8400,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[1]._id,
        eventId: events[5]._id,
        quantity: 1,
        totalAmount: 9000,
        discountAmount: 1500,
        finalAmount: 7500,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[2]._id,
        eventId: events[6]._id,
        quantity: 1,
        totalAmount: 4800,
        discountAmount: 0,
        finalAmount: 4800,
        bookingStatus: 'cancelled',
      },
      {
        userId: users[3]._id,
        eventId: events[7]._id,
        quantity: 1,
        totalAmount: 7200,
        discountAmount: 0,
        finalAmount: 7200,
        bookingStatus: 'confirmed',
      },
      {
        userId: users[4]._id,
        eventId: events[8]._id,
        quantity: 2,
        totalAmount: 7800,
        discountAmount: 0,
        finalAmount: 7800,
        bookingStatus: 'confirmed',
      },
    ]);

    console.log(`Seeded ${bookings.length} bookings`);

    const reviews = await Review.insertMany([
      {
        userId: users[0]._id,
        eventId: events[0]._id,
        rating: 5,
        comment: 'Excellent lineup of speakers and very practical sessions. The BMICH setup felt polished from registration to closing remarks.',
        status: 'visible',
      },
      {
        userId: users[1]._id,
        eventId: events[1]._id,
        rating: 4,
        comment: 'Great energy, good sound, and a fun crowd. Food queues were a bit long right after sunset, but the beachside atmosphere made up for it.',
        status: 'visible',
      },
      {
        userId: users[2]._id,
        eventId: events[2]._id,
        rating: 5,
        comment: 'Very useful startup event. I met founders, bankers, and investors in one place, and the pitch feedback was genuinely helpful.',
        status: 'visible',
      },
      {
        userId: users[0]._id,
        eventId: events[3]._id,
        rating: 4,
        comment: 'Strong creator panel and a lot of actionable advice on brand deals and short-form content. The networking hour was especially good.',
        status: 'visible',
      },
      {
        userId: users[3]._id,
        eventId: events[0]._id,
        rating: 5,
        comment: 'One of the best local tech events I have attended. The cloud and AI sessions were relevant and well paced for engineering teams.',
        status: 'visible',
      },
      {
        userId: users[4]._id,
        eventId: events[4]._id,
        rating: 5,
        comment: 'A peaceful and well-organized wellness day. The hill-country setting and healthy meal options made the whole experience feel premium.',
        status: 'visible',
      },
      {
        userId: users[1]._id,
        eventId: events[5]._id,
        rating: 4,
        comment: 'Useful discussions for banking teams exploring AI. I would have liked a slightly longer Q and A after the fraud detection session.',
        status: 'visible',
      },
      {
        userId: users[3]._id,
        eventId: events[7]._id,
        rating: 5,
        comment: 'The bootcamp was practical from start to finish. We left with a working mobile app and clear deployment steps.',
        status: 'visible',
      },
      {
        userId: users[4]._id,
        eventId: events[8]._id,
        rating: 4,
        comment: 'Very relevant for hospitality teams. The service blueprint exercise was simple, memorable, and easy to reuse at work.',
        status: 'visible',
      },
    ]);

    console.log(`Seeded ${reviews.length} reviews`);

    const complaints = await Complaint.insertMany([
      {
        userId: users[0]._id,
        eventId: events[0]._id,
        bookingId: bookings[0]._id,
        subject: 'Wi-Fi slowed down during the afternoon sessions',
        description: 'The venue Wi-Fi became unstable during the live demo block, so it was hard to follow the workshop exercises. Please improve connectivity for future tech sessions.',
        issueType: 'event',
        priority: 'medium',
        status: 'resolved',
        adminResponse: 'Thanks for raising this. We have arranged a dedicated attendee network and a backup line for the next BMICH tech event.',
      },
      {
        userId: users[1]._id,
        eventId: events[1]._id,
        bookingId: bookings[1]._id,
        subject: 'Charged twice for one of the festival tickets',
        description: 'I booked three tickets, but one of the card authorizations appears twice in my banking app. Please confirm whether the duplicate hold will be reversed.',
        issueType: 'payment',
        priority: 'high',
        status: 'in_progress',
        adminResponse: 'Our payment team is checking the gateway logs and will update you within 3 business days if a reversal is needed.',
      },
      {
        userId: users[2]._id,
        subject: 'Booking confirmation screen crashed on Android',
        description: 'The app closed when I tried to reopen my booking confirmation after payment. I am using Android 14 on a Samsung device and can reproduce it consistently.',
        issueType: 'technical',
        priority: 'high',
        status: 'open',
      },
      {
        userId: users[3]._id,
        eventId: events[7]._id,
        subject: 'Need my bootcamp completion certificate',
        description: 'I attended the Mobile App Builder Bootcamp and was told the certificate would be emailed after the session. I still have not received it.',
        issueType: 'event',
        priority: 'low',
        status: 'open',
      },
      {
        userId: users[4]._id,
        eventId: events[4]._id,
        bookingId: bookings[5]._id,
        subject: 'Requested vegetarian lunch was not clearly labeled',
        description: 'The food quality was good overall, but the vegetarian options were not clearly marked during lunch. A few attendees had to ask staff for guidance.',
        issueType: 'event',
        priority: 'medium',
        status: 'resolved',
        adminResponse: 'We appreciate the feedback. Future wellness events will have clearer dietary labels and a dedicated serving station for special meal requests.',
      },
    ]);

    console.log(`Seeded ${complaints.length} complaints`);

    const promoCodes = await PromoCode.insertMany(promoCodeSeed);

    console.log(`Seeded ${promoCodes.length} promo codes`);

    console.log('\nDatabase seeded successfully!');
    console.log('----------------------------------------');
    console.log('Admin Login:  admin@eventify.com / admin123');
    console.log('User Login:   hasindut1@gmail.com / password123');
    console.log('----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
