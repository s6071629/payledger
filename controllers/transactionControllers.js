const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const {depositToAccount, withdrawFromAccount} = require("../services/transferControllers");

const deposit = asyncHandler(async (req, res) => {

    const { amount } = req.body;
    const { id } = req.params;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount"
        });
    }

    if (!idempotencyKey) {
        return res.status(400).json({
            message: "Idempotency key required"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query(
            `select transaction_id, status
             from transactions
             where idempotency_key = ?`,
            [idempotencyKey]
        );

        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(200).json({
                message: "Transaction already exists",
                transaction_id: existing[0].transaction_id,
                status: existing[0].status
            });
        }

        const [transaction] = await connection.query(
            `insert into transactions
             (idempotency_key, type, status)
             values (?,'deposit', 'processing')`,
            [idempotencyKey]
        );

        const transactionId = transaction.insertId;

        const [accounts] = await connection.query(
            `select account_id, balance
             from accounts
             where account_id = ?
             for update`,
            [id]
        );

        if (accounts.length === 0) {
            throw new Error("Account not found");
        }

        const account = accounts[0];
        const newBalance = Number(account.balance) + Number(amount);

        await connection.query(
            `update accounts
             set balance = ?
             where account_id = ?`,
            [newBalance, account.account_id]
        );
        await connection.query(
            `insert into ledger
             (transaction_id, account_id, direction, amount, balance_after)
             VALUES (?, ?, 'credit', ?, ?)`,
            [transactionId,account.account_id,amount,newBalance]
        );
        await connection.query(
            `update transactions
            set status = 'completed'
            where transaction_id = ?`,
            [transactionId]
        );
        await connection.commit();
        connection.release();
        return res.status(200).json({
            message: "Deposit successful",
            transaction_id: transactionId,
            amount: amount,
            balance: newBalance
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error(error);
        return res.status(500).json({
            message: "Deposit failed"
        });
    } finally {
       connection.release();
    }
});

const withdrawal = asyncHandler(async (req, res) => {

    const { amount } = req.body;
    const { id } = req.params;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount"
        });
    }

    if (!idempotencyKey) {
        return res.status(400).json({
            message: "Idempotency key required"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query(
            `select transaction_id, status
             from transactions
             where idempotency_key = ?`,
            [idempotencyKey]
        );

        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(200).json({
                message: "Transaction already exists",
                transaction_id: existing[0].transaction_id,
                status: existing[0].status
            });
        }

        const [transaction] = await connection.query(
            `insert into transactions
             (idempotency_key, type, status)
             values (?,'withdrawal', 'processing')`,
            [idempotencyKey]
        );

        const transactionId = transaction.insertId;

        const [accounts] = await connection.query(
            `select account_id, balance
             from accounts
             where account_id = ?
             for update`,
            [id]
        );

        if (accounts.length === 0) {
            throw new Error("Account not found");
        }

        const account = accounts[0];
        const newBalance = Number(account.balance) - Number(amount);

        if (newBalance < 0) {
            throw new Error("Insufficient balance");
        }

        await connection.query(
            `update accounts
             set balance = ?
             where account_id = ?`,
            [newBalance, account.account_id]
        );
        await connection.query(
            `insert into ledger
             (transaction_id, account_id, direction, amount, balance_after)
             VALUES (?, ?, 'debit', ?, ?)`,
            [transactionId,account.account_id,amount,newBalance]
        );
        await connection.query(
            `update transactions
            set status = 'completed'
            where transaction_id = ?`,
            [transactionId]
        );
        await connection.commit();
        connection.release();
        return res.status(200).json({
            message: "Withdrawal successful",
            transaction_id: transactionId,
            amount: amount,
            balance: newBalance
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error(error);
        return res.status(500).json({
            message: "Withdrawal failed"
        });
    } finally {
        connection.release();
    }
});

const transfer = asyncHandler(async (req, res) => {

    const { amount, sender_id, receiver_id } = req.body;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!amount || amount <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount"
        });
    }

    if (!sender_id || !receiver_id) {
        return res.status(400).json({
            message: "Enter sender_id and receiver_id"
        });
    }

    if (sender_id === receiver_id) {
        return res.status(400).json({
            message: "Sender and receiver cannot be same"
        });
    }

    if (!idempotencyKey) {
        return res.status(400).json({
            message: "Idempotency key required"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const [existing] = await connection.query(
            `select transaction_id, status
             from transactions
             where idempotency_key = ?`,
            [idempotencyKey]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(200).json({
                message: "Transaction already exists",
                transaction_id: existing[0].transaction_id,
                status: existing[0].status
            });
        }

        const [transaction] = await connection.query(
            `insert INTO transactions
             (idempotency_key, type, status)
             values (?, 'transfer', 'processing')`,
            [idempotencyKey]
        );

        const transactionId = transaction.insertId;
        const senderBalance = await withdrawFromAccount(connection,sender_id,
            amount,transactionId);

        const receiverBalance = await depositToAccount(connection,receiver_id,
            amount,transactionId);

        await connection.query(
            `update transactions
             set status = 'completed'
             where transaction_id = ?`,
            [transactionId]
        );

        await connection.commit();
        return res.status(200).json({
            message: "Transfer successful",
            transaction_id: transactionId,
            sender_id,
            receiver_id,
            amount,
            sender_balance: senderBalance,
            receiver_balance: receiverBalance
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(500).json({
            message: error.message || "Transfer failed"
        });
    } finally {
        connection.release();
    }
});

const getAll = asyncHandler(async (req, res) => {

    const { id } = req.params;
    const [transactions] = await db.query(
        `select
            t.transaction_id, t.type, t.status, t.created_at,
            l.account_id, l.direction, l.amount, l.balance_after
         from transactions t
         join ledger l
            on t.transaction_id = l.transaction_id
         join accounts a
            on l.account_id = a.account_id
         where a.user_id = ?
         order by t.created_at DESC`,
        [id]
    );

    return res.status(200).json({
        user_id: id,
        count: transactions.length,
        transactions: transactions
    });
});

module.exports = {
    deposit,
    withdrawal,
    transfer,
    getAll
};