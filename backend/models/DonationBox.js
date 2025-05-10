const mongoose = require("mongoose");

const donationBoxSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  availableHours: {
    type: String, // e.g., "9 AM - 5 PM"
    required: false,
  },
  itemsAccepted: {
    type: [String], // e.g., ["Clothes", "Groceries"]
    required: false,
    default: [],
  },
  createdAt: { type: Date, default: Date.now }
});

donationBoxSchema.index({ location: '2dsphere' }); // for geo queries

module.exports = mongoose.model("DonationBox", donationBoxSchema);
