const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./modules/events/Event');
dotenv.config();

const testEvents = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const events = await Event.find({}, 'title category -_id');
  console.log(events);
  process.exit(0);
};

testEvents();
