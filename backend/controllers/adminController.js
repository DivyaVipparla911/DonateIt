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
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const deleteDonations = async (req, res) =>{
  const { id } = req.params;
  const { name, email, description, address, status, assignee, dateTime } = req.body;
try {
  const deletedEvent = await Donation.findByIdAndDelete(id);
  if (!deletedEvent) {
    return res.status(404).json({ message: 'Donation not found' });
  }
  res.status(200).json({ message: 'Donation deleted successfully' });

  if (deletedEvent.email) {
    sendDeleteEmail(deletedEvent.email, deletedEvent);
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
 const { name, description, address, availableHours, itemsAccepted } = req.body;

  // Dummy geo-coding — replace with real API if needed
  const fakeCoordinates = [77.5946, 12.9716]; // [longitude, latitude]

  try {
    const donationBox = new DonationBox({
      name,
      description,
      location: {
        type: 'Point',
        coordinates: fakeCoordinates
      },
      availableHours,
      itemsAccepted
    });


    await donation.save();

    res.status(201).json({ message: "Donation submitted successfully", donation });
  } catch (error) {
    console.error('Error saving donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports = { deleteEvents, deleteDonations, editDonations, addDonationBoxes};