const express = require('express');
const router = express.Router();
const {deposit, withdrawal, transfer, getAll} = require('../controllers/transactionControllers');

router.post("/:id/deposit", deposit);

router.post("/:id/withdrawal", withdrawal);

router.post("/transfer", transfer);

router.get("/:id/getAll", getAll);

module.exports = router;