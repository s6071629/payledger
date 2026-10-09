const express = require('express');
const router = express.Router();

const { createAccount, getBalance, getDetails} = 
require('../controllers/accountControllers');

const protect = require('../middleware/authMiddleware');

router.post("/create",protect, createAccount);

router.get("/balance",protect, getBalance);

router.get("/me",protect, getDetails);

module.exports = router;