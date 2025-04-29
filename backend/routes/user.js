const express = require('express');
const router = express.Router();
const { getUserDetails, addDonation, addEvent, getAllEvents, getDonations} = require('../controllers/userController');

router.get('/user-details', getUserDetails);
router.post('/donations', addDonation);
router.post('/events', addEvent);
router.get('/events', getAllEvents);
router.get('/donations', getDonations);


module.exports = router;