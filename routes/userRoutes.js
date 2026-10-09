const express = require('express');
const router = express.Router();
const {registerUser, getUser, loginUser} = require('../controllers/userControllers');

const protect = require('../middleware/authMiddleware');

router.post('/', registerUser);

router.get('/me',protect, getUser);

router.post('/login', loginUser);

module.exports = router;