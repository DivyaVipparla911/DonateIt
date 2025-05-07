// models/DonationBox.js (using Mongoose)
const mongoose = require("mongoose");

const donationBoxSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now }
});

donationBoxSchema.index({ location: '2dsphere' }); // for geo queries

module.exports = mongoose.model("DonationBox", donationBoxSchema);
