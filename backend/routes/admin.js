const express = require('express');
const router = express.Router();
const { deleteEvents, deleteDonations, editDonations } = require('../controllers/adminController');

router.delete('/events/:id', deleteEvents); 
router.delete('/donations/:id', deleteDonations); 
router.put('/donations/:id', editDonations); 


module.exports = router;
