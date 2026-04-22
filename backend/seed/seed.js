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
    comment: 'Strong creator panel and a lot of actionable advice on brand deals and short-form content.',
    status: 'visible',
  }
]);