const admin = require('../firebase/firebaseAdmin');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Event = require('../models/Event');
const DonationBox = require('../models/DonationBox');
const { sendUpdateEmail, sendDeleteEmail } = require('../utils/sendEmail');

const deleteEvents = async (req, res) =>{
    const { id } = req.params;

  try {
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
    if (deletedEvent.email) {
    sendDeleteEmail(deletedEvent.email, deletedEvent);
  }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const deleteDonationBoxes = async (req, res) =>{
    const { id } = req.params;

  try {
    const deletedDonationBox = await DonationBox.findByIdAndDelete(id);
    if (!deletedDonationBox) {
      return res.status(404).json({ message: 'DonationBox not found' });
    }
    res.status(200).json({ message: 'DonationBox deleted successfully' });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const deleteDonations = async (req, res) =>{
  const { id } = req.params;
try {
  console.log("delete donation");
  const deletedDonation = await Donation.findByIdAndDelete(id);
  if (!deletedDonation) {
    return res.status(404).json({ message: 'Donation not found' });
  }
  res.status(200).json({ message: 'Donation deleted successfully' });

  if (deletedDonation.email) {
    sendDeleteEmail(deletedDonation.email, deletedDonation);
  }

} catch (error) {
  console.error('Error deleting donation:', error);
  res.status(500).json({ message: 'Server error' });
}
}

const editDonations = async (req, res) => {
  const { id } = req.params;
  const { name, description, address, status, assignee, dateTime } = req.body;

  try {
    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      { name, description, address, status, assignee, dateTime },
      { new: true } 
    );

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    console.log(updatedDonation.email);

    if (updatedDonation?.email) {
      sendUpdateEmail(updatedDonation.email, updatedDonation);
    }

    res.status(200).json({ message: 'Donation updated successfully', donation: updatedDonation });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addDonationBoxes = async (req, res) => {
  const {
    name,
    address,
    latitude,
    longitude,
    type,
    hours,
    phone
  } = req.body;

  // Basic validation
  if (!name || !address || !latitude || !longitude || !type || !hours || !phone) {
    return res.status(400).json({ 
      success: false,
      message: "All fields are required" 
    });
  }

  try {
    // Get the next sequential ID
    const nextId = await getNextDonationBoxId();

    // Create new donation box
    const donationBox = new DonationBox({
      id: nextId,  // Auto-assigned sequential number
      name,
      address,
      coordinates: {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      type,
      hours,
      phone
    });

    await donationBox.save();

    res.status(201).json({
      success: true,
      message: "Donation box added successfully",
      data: donationBox
    });

  } catch (error) {
    console.error('Error adding donation box:', error);
    
    // Handle duplicate ID case (though unlikely with our sequential approach)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate ID detected, please try again"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Helper function to get the next sequential ID
const getNextDonationBoxId = async () => {
  const lastBox = await DonationBox.findOne().sort({ id: -1 });
  return lastBox ? lastBox.id + 1 : 1;
};


module.exports = { deleteEvents, deleteDonations, editDonations, addDonationBoxes, deleteDonationBoxes};