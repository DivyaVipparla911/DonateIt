const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  user_role: { type: String, default: 'user' },
  name: {type: String, required: true },
  dateOfBirth : {type: Date , required: true },
});

module.exports = mongoose.model('User', userSchema);
