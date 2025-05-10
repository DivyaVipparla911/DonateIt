const mongoose = require("mongoose");

const donationBoxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  type: { type: String, required: true },
  hours: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

donationBoxSchema.index({ location: '2dsphere' }); // for geo queries

module.exports = mongoose.model("DonationBox", donationBoxSchema);
