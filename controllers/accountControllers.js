const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const createAccount = asyncHandler(async (req, res) => {
    const { password, account_type } = req.body;
    const { id } = req.params;

    if (!password || !account_type) {
        return res.status(400).json({
            message: "Enter the password and account_type"
        });
    }

    const checkSql = `select account_id from accounts where user_id = ?`;

    const [results] = await db.query(checkSql, [id]);

    if (results.length > 0) {
        return res.status(409).json({
            message: "User already has an account"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `insert into accounts (user_id, account_type, password)
        values (?, ?, ?)`;

    const [result] = await db.query(insertSql,[id, account_type, hashedPassword]);

    return res.status(201).json({
        message: "Account created successfully",
        account_id: result.insertId,
        user_id: id,
        account_type: account_type
    });
});

const getBalance = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const getQuery = `select balance from accounts where user_id = ?`;

    const [result] = await db.query(getQuery, [id]);

    if (result.length === 0) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    return res.status(200).json({
        balance: result[0].balance
    });
});

const getDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const getQuery = `select account_id, account_type, balance, created_at
        from accounts where user_id = ?`;
    const [result] = await db.query(getQuery, [id]);

    if (result.length === 0) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    return res.status(200).json({
        accountId: result[0].account_id,
        balance: result[0].balance,
        account_type: result[0].account_type,
        created_at: result[0].created_at
    });
});

module.exports = {
    createAccount,
    getBalance,
    getDetails
};