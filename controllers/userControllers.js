const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const registerUser = asyncHandler(async (req, res) => {
    const { userName, pw } = req.body;

    if (!userName || !pw) {
        return res.status(400).json({
            message: 'Please enter userName and password'
        });
    }

    const checkSql = `select user_id from users where user_name = ?`;

    const [results] = await db.query(checkSql, [userName]);

    if (results.length > 0) {
        return res.status(409).json({
            message: 'User already exists'
        });
    }

    const hashedPassword = await bcrypt.hash(pw, 10);

    const insertSql = `insert into users (user_name, password)
        values (?, ?)`;

    const [result] = await db.query(insertSql,[userName, hashedPassword]);

    return res.status(201).json({
        message: 'User registered successfully',
        user_id: result.insertId,
        user_name: userName
    });
});


const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({
            message: "Enter id"
        });
    }

    const sql = `select user_id, user_name from users where user_id = ?`;

    const [results] = await db.query(sql, [id]);

    if (results.length === 0) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    return res.status(200).json({
        user_id: results[0].user_id,
        user_name: results[0].user_name
    });
});


module.exports = {
    registerUser,
    getUser
};