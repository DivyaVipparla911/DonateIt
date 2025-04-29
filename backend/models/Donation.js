const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: {type: String, required: true },
  category : {type: [String] , required: true },
  description : {type: String, required: true },
  images: { type: [String], required: false},
  address : {type: String, required: true },
  status : {type: String, required: false },
});

module.exports = mongoose.model('Donation', donationSchema);
