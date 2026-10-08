const express = require('express');
const router = express.Router();
const {registerUser, getUser} = require('../controllers/userControllers');

router.post('/', registerUser);

router.get('/:id', getUser);

module.exports = router;