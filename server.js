const express = require('express');
const dotenv = require('dotenv');
const connect = require('./config/db');

const app = express();
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

dotenv.config();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        message: 'Payments API is running'
    });
});

app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);

app.listen(PORT, () => 
    console.log('Server running on port 5000')
);