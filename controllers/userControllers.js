const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    const userId = req.user.user_id;

    console.log("USER ID:", userId);

    const sql = `select user_id, user_name, created_at
        from users where user_id = ?`;

    const [results] = await db.query(sql, [userId]);

    if (results.length === 0) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    return res.status(200).json({
        user_id: results[0].user_id,
        user_name: results[0].user_name,
        created_at: results[0].created_at
    });
});


const loginUser = asyncHandler(async (req, res) => {
    const { userName, pw } = req.body;
    if (!userName || !pw) {
        return res.status(400).json({
            message: 'Please enter userName and password'
        });
    }

    const sql = `select user_id, user_name, password from users
        where user_name = ?`;

    const [users] = await db.query(sql, [userName]);
    if (users.length === 0) {
        return res.status(401).json({
            message: 'Invalid username or password'
        });
    }
    const user = users[0];

    const passwordMatch = await bcrypt.compare(pw,user.password);

    if (!passwordMatch) {
        return res.status(401).json({
            message: 'Invalid username or password'
        });
    }

    const payload = {
    user_id: user.user_id,
    user_name: user.user_name
};

console.log("PAYLOAD:", payload);

    const token = jwt.sign({
            user_id: user.user_id,
            user_name: user.user_name
        },
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    );
    const testDecoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).json({
        message: 'Login successful',
        token: token
    });
});


module.exports = {
    registerUser,
    getUser,
    loginUser
};