const express = require('express');
const router = express.Router();

const { createAccount, getBalance, getDetails} = 
require('../controllers/accountControllers');

router.post("/:id/create", createAccount);

router.get("/:id/balance", getBalance);

router.get("/:id/details", getDetails);

module.exports = router;