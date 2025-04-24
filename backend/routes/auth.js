const express = require('express');
const router = express.Router();
const { signup, signin, getUserRole } = require('../controllers/authController');

router.post('/signup', signup); // email, password
router.post('/signin', signin); // idToken
router.get('/getUserRole/:uid', getUserRole);

module.exports = router;
