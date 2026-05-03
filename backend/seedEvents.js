const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./modules/events/Event');
const User = require('./modules/users/User');
const Venue = require('./modules/venues/Venue');

dotenv.config();

const venueSeedByLocation = {
  'Lotus Tower Club, Colombo': {
    name: 'Lotus Tower Club',
    address: 'D. R. Wijewardena Mawatha, Colombo 10',
    city: 'Colombo',
    capacity: 1000,
    description: 'A skyline venue suited for nightlife experiences, launch parties, and premium music events.',
    contactPhone: '+94 11 242 4242',
    contactEmail: 'events@lotustower.lk',
    facilities: ['Parking', 'Night Lighting', 'VIP Lounge'],
  },
  'Port City, Colombo': {
    name: 'Port City Event Grounds',
    address: 'Port City Colombo, Colombo 01',
    city: 'Colombo',
    capacity: 5000,
    description: 'A large-scale waterfront event ground for festivals, public activations, and outdoor concerts.',
    contactPhone: '+94 11 214 7474',
    contactEmail: 'events@portcity.lk',
    facilities: ['Outdoor Stage', 'Security Gates', 'Food Village'],
  },
  'Unawatuna Beach, Galle': {
    name: 'Unawatuna Beach Event Deck',
    address: 'Yaddehimulla Road, Unawatuna, Galle',
    city: 'Galle',
    capacity: 1500,
    description: 'A beachside venue for sunset parties, music festivals, and branded lifestyle events.',
    contactPhone: '+94 91 438 9055',
    contactEmail: 'events@unawatunabeach.lk',
    facilities: ['Beach Access', 'Stage Truss', 'Artist Area'],
  },
  'Nelum Pokuna Mahinda Rajapaksa Theatre': {
    name: 'Nelum Pokuna Theatre',
    address: 'Ananda Coomaraswamy Mawatha, Colombo 07',
    city: 'Colombo',
    capacity: 1200,
    description: 'A flagship performance venue for theatre, music productions, and national arts showcases.',
    contactPhone: '+94 11 266 2277',
    contactEmail: 'boxoffice@nelumpokuna.lk',
    facilities: ['Auditorium Seating', 'Backstage Rooms', 'Sound Console'],
  },
  'BMICH, Colombo': {
    name: 'BMICH Exhibition Hall',
    address: 'Bauddhaloka Mawatha, Colombo 07',
    city: 'Colombo',
    capacity: 15000,
    description: 'A flexible exhibition and convention venue for concerts, expos, and public fairs.',
    contactPhone: '+94 11 269 1131',
    contactEmail: 'events@bmich.lk',
    facilities: ['Large Hall', 'Parking', 'Exhibition Booth Space'],
  },
  'Lionel Wendt Theatre': {
    name: 'Lionel Wendt Theatre',
    address: 'Guildford Crescent, Colombo 07',
    city: 'Colombo',
    capacity: 600,
    description: 'A classic Colombo arts venue for theatre, chamber performances, and cultural programs.',
    contactPhone: '+94 11 269 5794',
    contactEmail: 'info@lionelwendt.org',
    facilities: ['Auditorium Seating', 'Green Room', 'Sound Booth'],
  },
  'Viharamahadevi Open Air Theatre': {
    name: 'Viharamahadevi Open Air Theatre',
    address: 'Viharamahadevi Park, Colombo 07',
    city: 'Colombo',
    capacity: 2000,
    description: 'An open-air performance venue for evening shows, live music, and city events.',
    contactPhone: '+94 11 268 5600',
    contactEmail: 'events@cmc.lk',
    facilities: ['Open Air Stage', 'Public Seating', 'Security'],
  },
  'Havelock Sports Club Grounds': {
    name: 'Havelock Grounds Event Arena',
    address: 'Havelock Park, Colombo 05',
    city: 'Colombo',
    capacity: 8000,
    description: 'A high-capacity urban grounds venue for concerts, youth gatherings, and outdoor festivals.',
    contactPhone: '+94 11 258 2001',
    contactEmail: 'events@havelockgrounds.lk',
    facilities: ['Large Grounds', 'Entry Gates', 'Vendor Space'],
  },
  'Bogambara Stadium, Kandy': {
    name: 'Bogambara Stadium',
    address: 'William Gopallawa Mawatha, Kandy',
    city: 'Kandy',
    capacity: 4000,
    description: 'A central Kandy venue used for concerts, sports-linked activations, and major public shows.',
    contactPhone: '+94 81 222 2233',
    contactEmail: 'events@bogambara.lk',
    facilities: ['Outdoor Arena', 'Stage Access', 'Parking'],
  },
  'Tower Hall Theatre': {
    name: 'Tower Hall Theatre',
    address: 'Maradana Road, Colombo 10',
    city: 'Colombo',
    capacity: 800,
    description: 'A heritage stage venue known for comedy, drama, and family entertainment.',
    contactPhone: '+94 11 269 5064',
    contactEmail: 'tickets@towerhall.lk',
    facilities: ['Stage Lighting', 'Seated Hall', 'Backstage'],
  },
  'Elphinstone Theatre': {
    name: 'Elphinstone Theatre',
    address: 'Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
    city: 'Colombo',
    capacity: 700,
    description: 'A restored heritage theatre for classic drama, cultural events, and live productions.',
    contactPhone: '+94 11 232 5276',
    contactEmail: 'events@elphinstone.lk',
    facilities: ['Classic Stage', 'Reserved Seating', 'Lobby'],
  },
  'Muttraweli Grounds, Jaffna': {
    name: 'Muttraweli Grounds',
    address: 'Muttraweli, Jaffna',
    city: 'Jaffna',
    capacity: 20000,
    description: 'A large northern grounds venue for trade fairs, festivals, and community exhibitions.',
    contactPhone: '+94 21 222 8877',
    contactEmail: 'bookings@muttraweli.lk',
    facilities: ['Fairgrounds', 'Vendor Zone', 'Public Entry Gates'],
  },
};

const eventsData = [
  // DJs
  {
    title: 'Party Night with DJ Zack and DJ Amil',
    description: 'The ultimate indoor DJ party club night with neon lights and modern electronic music aesthetic. Get ready for an unforgettable night!',
    category: 'music',
    eventDate: new Date('2026-04-15'),
    startTime: '22:00',
    endTime: '04:00',
    location: 'Lotus Tower Club, Colombo',
    organizerName: 'Electronic LK',
    ticketPrice: 5000,
    totalSeats: 1000,
    availableSeats: 1000,
    eventImage: '/uploads/dj_party.png',
    status: 'upcoming'
  },
  {
    title: 'Sunburn Colombo 2026',
    description: 'The biggest outdoor DJ festival hitting the shores of Sri Lanka. Featuring top international and local artists.',
    category: 'music',
    eventDate: new Date('2026-05-20'),
    startTime: '18:00',
    endTime: '06:00',
    location: 'Port City, Colombo',
    organizerName: 'Sunburn LK',
    ticketPrice: 8500,
    totalSeats: 5000,
    availableSeats: 5000,
    eventImage: '/uploads/sunburn_colombo.png',
    status: 'upcoming'
  },
  {
    title: 'Sunset Beach Party',
    description: 'Unawatuna beach party with non-stop electronic music, fire dancers, and amazing vibes until sunrise.',
    category: 'music',
    eventDate: new Date('2026-06-12'),
    startTime: '16:00',
    endTime: '05:00',
    location: 'Unawatuna Beach, Galle',
    organizerName: 'Beach Vibes LK',
    ticketPrice: 3500,
    totalSeats: 1500,
    availableSeats: 1500,
    eventImage: '/uploads/sunset_beach.png',
    status: 'upcoming'
  },

  // Indoor Music Events
  {
    title: 'Kuweni The Musical',
    description: 'A spectacular indoor musical event showcasing the epic tale of Kuweni with modern musical arrangements and breathtaking performances.',
    category: 'music',
    eventDate: new Date('2026-04-25'),
    startTime: '18:30',
    endTime: '21:30',
    location: 'Nelum Pokuna Mahinda Rajapaksa Theatre',
    organizerName: 'Charitha Attalage',
    ticketPrice: 6000,
    totalSeats: 1200,
    availableSeats: 1200,
    eventImage: '/uploads/kuweni_musical.png',
    status: 'upcoming'
  },
  {
    title: 'Liyara - Live in Concert',
    description: 'Experience an unforgettable evening with the most melodious voices in Sri Lanka. An indoor unplugged session.',
    category: 'music',
    eventDate: new Date('2026-05-02'),
    startTime: '19:00',
    endTime: '22:00',
    location: 'BMICH, Colombo',
    organizerName: 'Evoke Events',
    ticketPrice: 4000,
    totalSeats: 1500,
    availableSeats: 1500,
    eventImage: '/uploads/liyara_concert.png',
    status: 'upcoming'
  },
  {
    title: 'Yanna Rata Wate',
    description: 'An instrumental journey capturing the essence of Sri Lankan music. From traditional beats to modern fusions.',
    category: 'music',
    eventDate: new Date('2026-05-15'),
    startTime: '18:00',
    endTime: '21:00',
    location: 'Lionel Wendt Theatre',
    organizerName: 'Music LK',
    ticketPrice: 2500,
    totalSeats: 600,
    availableSeats: 600,
    eventImage: '/uploads/yanna_rata_wate.png',
    status: 'upcoming'
  },

  // Outdoor Musical Events
  {
    title: 'Handawa - Evening of Music',
    description: 'A beautiful outdoor musical evening featuring classic hits. Enjoy the sunset with great tunes.',
    category: 'music',
    eventDate: new Date('2026-04-10'),
    startTime: '16:30',
    endTime: '23:00',
    location: 'Viharamahadevi Open Air Theatre',
    organizerName: 'Colombo Events',
    ticketPrice: 3000,
    totalSeats: 2000,
    availableSeats: 2000,
    eventImage: '/uploads/handawa_evening.png',
    status: 'upcoming'
  },
  {
    title: 'Aluth Kalawak 2026',
    description: 'A massive gathering of youth for a new era of music. High energy, amazing stage, and unparalleled vibes.',
    category: 'music',
    eventDate: new Date('2026-07-20'),
    startTime: '17:00',
    endTime: '23:59',
    location: 'Havelock Sports Club Grounds',
    organizerName: 'Youth LK',
    ticketPrice: 4500,
    totalSeats: 8000,
    availableSeats: 8000,
    eventImage: '/uploads/aluth_kalawak.png',
    status: 'upcoming'
  },
  {
    title: 'Rock Fest Kandy',
    description: 'The biggest outdoor rock festival in the hill country. Featuring the best of Sri Lankan rock bands.',
    category: 'music',
    eventDate: new Date('2026-08-05'),
    startTime: '14:00',
    endTime: '23:00',
    location: 'Bogambara Stadium, Kandy',
    organizerName: 'Rock LK',
    ticketPrice: 3500,
    totalSeats: 4000,
    availableSeats: 4000,
    eventImage: '/uploads/rock_fest_kandy.png',
    status: 'upcoming'
  },

  // Dramas / Stage Dramas
  {
    title: 'Sinhabahu Stage Drama',
    description: 'The legendary Sri Lankan stage drama by Prof. Ediriweera Sarachchandra. A masterpiece of traditional theatre.',
    category: 'other',
    eventDate: new Date('2026-04-20'),
    startTime: '18:30',
    endTime: '21:00',
    location: 'Lionel Wendt Theatre',
    organizerName: 'Sarachchandra Productions',
    ticketPrice: 2000,
    totalSeats: 600,
    availableSeats: 600,
    eventImage: '/uploads/sinhabahu_drama.png',
    status: 'upcoming'
  },
  {
    title: 'Nari Bena Extravaganza',
    description: 'A hilarious classic stage play that has entertained generations. Perfect for the whole family.',
    category: 'other',
    eventDate: new Date('2026-05-10'),
    startTime: '15:30',
    endTime: '18:00',
    location: 'Tower Hall Theatre',
    organizerName: 'Tower Hall Foundation',
    ticketPrice: 1500,
    totalSeats: 800,
    availableSeats: 800,
    eventImage: '/uploads/nari_bena.png',
    status: 'upcoming'
  },
  {
    title: 'Maname',
    description: 'A profound milestone in Sri Lankan theatrical history. An unforgettable experience of rhythm and story.',
    category: 'other',
    eventDate: new Date('2026-06-05'),
    startTime: '18:30',
    endTime: '21:00',
    location: 'Elphinstone Theatre',
    organizerName: 'Tower Hall Theatre Foundation',
    ticketPrice: 2000,
    totalSeats: 700,
    availableSeats: 700,
    eventImage: '/uploads/maname.png',
    status: 'upcoming'
  },

  // Exhibitions
  {
    title: 'Colombo Motor Show 2026',
    description: 'The largest automobile exhibition in Sri Lanka featuring the latest models, vintage cars, and heavy machinery.',
    category: 'networking',
    eventDate: new Date('2026-09-10'),
    startTime: '09:00',
    endTime: '20:00',
    location: 'BMICH, Colombo',
    organizerName: 'Asia Exhibitions',
    ticketPrice: 500,
    totalSeats: 15000,
    availableSeats: 15000,
    eventImage: '/uploads/colombo_motor.png',
    status: 'upcoming'
  },
  {
    title: 'Sri Lanka International Book Fair',
    description: 'A haven for book lovers. The biggest literary event of the year with international publishers and local authors.',
    category: 'education',
    eventDate: new Date('2026-09-20'),
    startTime: '09:00',
    endTime: '21:00',
    location: 'BMICH, Colombo',
    organizerName: 'Sri Lanka Book Publishers Association',
    ticketPrice: 100,
    totalSeats: 50000,
    availableSeats: 50000,
    eventImage: '/uploads/book_fair.png',
    status: 'upcoming'
  },
  {
    title: 'Jaffna International Trade Fair',
    description: 'Connecting North and South through commerce. Explore endless business opportunities at the biggest trade fair in the North.',
    category: 'business',
    eventDate: new Date('2026-10-15'),
    startTime: '10:00',
    endTime: '19:00',
    location: 'Muttraweli Grounds, Jaffna',
    organizerName: 'LECS',
    ticketPrice: 200,
    totalSeats: 20000,
    availableSeats: 20000,
    eventImage: '/uploads/jaffna_trade.png',
    status: 'upcoming'
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully!');

    // Get an admin user to set as the creator
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Creating a default admin user...');
      adminUser = new User({
        fullName: 'Admin User',
        email: 'admin@eventify.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();
      console.log('Default admin user created.');
    }

    // Optional: Only insert if less than 15 events exist to prevent massive duplication 
    // or we can clean up existing sample data. We will clean up first.
    console.log('Clearing existing events...');
    await Event.deleteMany({});

    const venueMap = {};
    for (const [location, venueData] of Object.entries(venueSeedByLocation)) {
      let venue = await Venue.findOne({ name: venueData.name });
      if (!venue) {
        venue = await Venue.create(venueData);
      }
      venueMap[location] = venue;
    }
    
    console.log('Inserting sample Sri Lankan events...');
    
    // Assign createdBy to all events
    const eventsWithCreator = eventsData.map(event => ({
      ...event,
      createdBy: adminUser._id,
      venueId: venueMap[event.location]?._id || null,
    }));

    await Event.insertMany(eventsWithCreator);
    
    console.log('15 Sample events added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
