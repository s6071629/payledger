require('dotenv').config();

const mysql = require('mysql2');

console.log("User:", process.env.DB_USER);
console.log("Password exists:", !!process.env.DB_PASSWORD);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.promise().query('SELECT 1')
    .then(() => {
        console.log("Connected to MySQL!");
    })
    .catch((err) => {
        console.error("DB ERROR:", err);
    });

module.exports = db.promise();