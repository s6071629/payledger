const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const {depositToAccount, withdrawFromAccount} 
= require("../services/transferControllers");

const deposit = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.user_id;
    const idempotencyKey = req.headers["idempotency-key"];
    if (!amount || Number(amount) <= 0) {
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
        const [accounts] = await connection.query(
            `select account_id from accounts where user_id = ?
            for update`,[userId]);

        if (accounts.length === 0) {
            throw new Error("Account not found");
        }

        const accountId = accounts[0].account_id;
        const [existing] = await connection.query(
            `select transaction_id, statusfrom transactions
            where idempotency_key = ?`,[idempotencyKey]);

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(200).json({
                message: "Transaction already exists",
                transaction_id: existing[0].transaction_id,
                status: existing[0].status
            });
        }

        const [transaction] = await connection.query(
            `insert into transactions (idempotency_key, type, status)
            values (?, 'deposit', 'processing')`,[idempotencyKey]);

        const transactionId = transaction.insertId;

        const newBalance = await depositToAccount(connection,accountId,
            amount, transactionId);

        await connection.query(
            `update transactions set status = 'completed'
            where transaction_id = ?`, [transactionId]);

        await connection.commit();

        return res.status(200).json({
            message: "Deposit successful",
            transaction_id: transactionId,
            amount: amount,
            balance: newBalance
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(500).json({
            message: error.message || "Deposit failed"
        });
    } finally {
        connection.release();
    }
});

const withdrawal = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.user_id;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!amount || Number(amount) <= 0) {
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
        const [accounts] = await connection.query(
            `select account_id from accounts where user_id = ?
            for update`,[userId]);

        if (accounts.length === 0) {
            throw new Error("Account not found");
        }

        const accountId = accounts[0].account_id;

        const [existing] = await connection.query(
            `select transaction_id, status from transactions
            where idempotency_key = ?`, [idempotencyKey]);

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(200).json({
                message: "Transaction already exists",
                transaction_id: existing[0].transaction_id,
                status: existing[0].status
            });
        }

        const [transaction] = await connection.query(
            `insert into transactions (idempotency_key, type, status)
            values (?, 'withdrawal', 'processing')`, [idempotencyKey]);

        const transactionId = transaction.insertId;

        const newBalance = await withdrawFromAccount(connection,
        accountId, amount, transactionId);

        await connection.query(
            `update transactions set status = 'completed'
            where transaction_id = ?`, [transactionId]);

        await connection.commit();

        return res.status(200).json({
            message: "Withdrawal successful",
            transaction_id: transactionId,
            amount: amount,
            balance: newBalance
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(400).json({
            message: error.message || "Withdrawal failed"
        });
    } finally {
        connection.release();
    }
});

const transfer = asyncHandler(async (req, res) => {

    const { amount, receiver_account_id} = req.body;
    const userId = req.user.user_id;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
            message: "Enter a valid amount"
        });
    }

    if (!receiver_account_id) {
        return res.status(400).json({
            message: "Receiver account ID is required"
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
        const [senderAccounts] = await connection.query(
            `select account_id from accounts where user_id = ?`,
            [userId]);

        if (senderAccounts.length === 0) {
            throw new Error("Sender account not found");
        }

        const senderAccountId = senderAccounts[0].account_id;

        const receiverAccountId = Number(receiver_account_id);

        if (senderAccountId === receiverAccountId) {
            throw new Error(
                "Sender and receiver cannot be the same"
            );
        }

        const [receiverAccounts] = await connection.query(
            `select account_id from accounts where account_id = ?`,
            [receiverAccountId]);

        if (receiverAccounts.length === 0) {
            throw new Error("Receiver account not found");
        }

        const [existing] = await connection.query(
            `select transaction_id, status from transactions
            where idempotency_key = ?`, [idempotencyKey]);

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(200).json({
                message: "Transaction already exists",
                transaction_id: existing[0].transaction_id,
                status: existing[0].status
            });
        }

        const [transaction] = await connection.query(
            `insert into transactions (idempotency_key, type, status)
            values (?, 'transfer', 'processing')`, [idempotencyKey]);

        const transactionId = transaction.insertId;
        const firstAccount = Math.min(senderAccountId, receiverAccountId);
        const secondAccount = Math.max(senderAccountId, receiverAccountId);
        await connection.query(
            `select account_id from accounts where account_id = ?
            for update`, [firstAccount]);

        await connection.query(
            `select account_id from accounts where account_id = ?
            for update`, [secondAccount]);

        const senderBalance = await withdrawFromAccount(
            connection, senderAccountId, amount, transactionId);

        const receiverBalance = await depositToAccount(connection,
            receiverAccountId, amount, transactionId);

        await connection.query(
            `update transactions set status = 'completed'
            where transaction_id = ?`, [transactionId]);

        await connection.commit();
        return res.status(200).json({
            message: "Transfer successful",
            transaction_id: transactionId,
            receiver_account_id: receiverAccountId,
            amount: amount,
            sender_balance: senderBalance,
            receiver_balance: receiverBalance
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(400).json({
            message: error.message || "Transfer failed"
        });
    } finally {
        connection.release();
    }
});

const getAll = asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const [transactions] = await db.query(
        `select t.transaction_id, t.type, t.status, t.created_at,
            l.account_id, l.direction, l.amount, l.balance_after
        from transactions t
        join ledger l
            on t.transaction_id = l.transaction_id
        join accounts a
            on l.account_id = a.account_id
        where a.user_id = ?
        order by t.created_at DESC`, [userId]
    );

    return res.status(200).json({
        user_id: userId,
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