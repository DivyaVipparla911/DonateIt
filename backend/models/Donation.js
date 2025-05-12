const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: {type: String, required: true },
  name: {type: String, required: true },
  category : {type: [String] , required: true },
  description : {type: String, required: true },
  images: { type: [String], required: false},
  address: {
    address: { type: String, required: false },
    coordinates: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false },
    }},
  availability: { type: String, required: false }, 
  status: { type: String, default: 'pending' }, 
  assignee: { type: String, required: false }, 
  dateTime: { type: String, required: false }, 
})

module.exports = mongoose.model('Donation', donationSchema);
