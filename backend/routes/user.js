const express = require('express');
const router = express.Router();
const { getUserDetails, addDonation, addEvent, getAllEvents, getAllDonations, getDonationBoxes} = require('../controllers/userController');

router.get('/user-details', getUserDetails);
router.post('/donations', addDonation);
router.post('/events', addEvent);
router.get('/events', getAllEvents);
router.get('/donations', getAllDonations);
router.get('/donation-boxes', getDonationBoxes);

module.exports = router;