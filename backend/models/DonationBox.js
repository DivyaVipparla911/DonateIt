const mongoose = require("mongoose");

const donationBoxSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  type: { type: String, required: true },
  hours: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Add a virtual GeoJSON point for geospatial queries
donationBoxSchema.virtual('location').get(function() {
  return {
    type: 'Point',
    coordinates: [this.coordinates.longitude, this.coordinates.latitude]
  };
});

// Ensure virtuals are included in toJSON output
donationBoxSchema.set('toJSON', { virtuals: true });

// Create 2dsphere index on the virtual field
donationBoxSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("DonationBox", donationBoxSchema);