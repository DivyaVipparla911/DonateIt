const express = require('express');
const router = express.Router();
const { signup, signin, getUserRole } = require('../controllers/authController');

router.post('/signup', signup); 
router.post('/signin', signin); 
router.get('/getUserRole/:uid', getUserRole);

module.exports = router;
