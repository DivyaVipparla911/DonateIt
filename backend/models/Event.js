const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organizer_id: { type: String, required: true },
  name: {type: String, required: true },
  description : {type: String , required: true },
  items_accepted : {type: [String], required: true },
  location : {type: String, required: true },
  date : {type: Date, required: true },
});

module.exports = mongoose.model('Event', eventSchema);
