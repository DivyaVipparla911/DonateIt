const admin = require('../firebase/firebaseAdmin');
const Donation = require('../models/Donation');
const Event = require('../models/Event');
const User = require('../models/User');
const DonationBox = require('../models/DonationBox');

const getUserDetails = async (req, res) => {
  try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const idToken = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const user = await User.findOne({ uid: decodedToken.uid });
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.status(200).json({
        email: user.email,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        role: user.user_role,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
};

const addDonation = async (req, res) =>{
  const { token,
    donationCategory,
    donationDescription,
    donorAddress,
    pickupTime,
    donationPhotos} = req.body;
  try {
    console.log("adding donation");
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email } = decodedToken;
      const user = await User.findOne({ uid: decodedToken.uid });
      const newDonation = new Donation({
            uid,
            email: user.email,
            name: user.name,
            category: donationCategory,
            description: donationDescription,
            address: donorAddress,
            availability: pickupTime,
            images: donationPhotos || [],
            status: 'pending',
          });
      await newDonation.save();
      res.status(201).json({ message: 'Donation created', user: newDonation });  
  } catch(err){
    console.log("couldn't add donation");
    res.status(500).json({ message: err.message });
  }
};

const addEvent = async (req, res) =>{
  const { token, name, description, location, date, items_accepted } = req.body;
  try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email } = decodedToken;
      console.log("saving event to mongo db", items_accepted);
      const newEvent = new Event({
            email: email,
            organizer_id: uid,
            name: name,
            description: description,
            location: location,
            date: date,
            items_accepted: items_accepted,
          });
      await newEvent.save();
      res.status(201).json({ message: 'Event created', user: newEvent });  
  } catch(err){
    res.status(500).json({ message: err.message });
  }
};

const getAllEvents = async (req, res) =>{
  try {
    const events = await Event.find({});
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const getAllDonations = async (req, res) =>{
  try {
    const donations = await Donation.find({});
    res.status(200).json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const getDonations = async (req, res) =>{
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try{
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;
    const donations = await Donation.find({ uid }).sort({ createdAt: -1 });
    res.status(200).json(donations);
  }catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ message: err.message });
  
  }
}

const getEvents = async (req, res) =>{
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try{
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;
    const events = await Event.find({ uid }).sort({ createdAt: -1 });
    res.status(200).json(events);
  }catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: err.message });
  
  }
}

const getDonationBoxes = async (req, res) =>{
  const boxes = await DonationBox.find();
  res.json(boxes);
}


module.exports = { getUserDetails, addDonation, addEvent, getAllEvents, getDonations, getEvents, getAllDonations, getDonationBoxes };