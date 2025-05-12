const express = require('express');
const router = express.Router();
const { deleteEvents, deleteDonations, editDonations, addDonationBoxes, deleteDonationBoxes } = require('../controllers/adminController');

router.delete('/events/:id', deleteEvents); 
router.delete('/donations/:id', deleteDonations); 
router.put('/donations/:id', editDonations); 
router.post('/donation-boxes', addDonationBoxes); 
router.delete('/donation-boxes/:id', deleteDonationBoxes); 




module.exports = router;
