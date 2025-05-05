const admin = require('../firebase/firebaseAdmin');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Event = require('../models/Event');

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

try {
  const deletedEvent = await Donation.findByIdAndDelete(id);
  if (!deletedEvent) {
    return res.status(404).json({ message: 'Donation not found' });
  }
  res.status(200).json({ message: 'Donation deleted successfully' });
} catch (error) {
  console.error('Error deleting donation:', error);
  res.status(500).json({ message: 'Server error' });
}
}

const editDonations = async (req, res) => {
  const { id } = req.params;
  const { name, description, address, status, assignee } = req.body;

  try {
    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      { name, description, address, status, assignee },
      { new: true }
    );

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.status(200).json({ message: 'Donation updated successfully', donation: updatedDonation });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports = { deleteEvents, deleteDonations, editDonations};