const express = require('express');
const router = express.Router();
const {deposit, withdrawal, transfer, getAll} = require('../controllers/transactionControllers');
const protect = require('../middleware/authMiddleware');

router.post("/deposit", protect, deposit);

router.post("/withdraw", protect, withdrawal);

router.post("/transfer", protect, transfer);

router.get("/getAll",protect, getAll);

module.exports = router;