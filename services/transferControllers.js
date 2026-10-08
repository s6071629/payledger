
const withdrawFromAccount = async (connection,accountId,
    amount,transactionId) => {
    const [accounts] = await connection.query(
        `select account_id, balance
         from accounts
         where account_id = ?`,
        [accountId]
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
        [newBalance, accountId]
    );

    await connection.query(
        `insert into ledger
         (transaction_id, account_id, direction, amount, balance_after)
         values (?, ?, 'debit', ?, ?)`,
        [transactionId,accountId,amount,newBalance]
    );
    return newBalance;
};


const depositToAccount = async(connection,accountId,amount,
    transactionId) => {
    const [accounts] = await connection.query(
        `select account_id, balance
         from accounts
         where account_id = ?`,
        [accountId]
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
        [newBalance, accountId]
    );

    await connection.query(
        `insert into ledger
         (transaction_id, account_id, direction, amount, balance_after)
         values (?, ?, 'credit', ?, ?)`,
        [transactionId,accountId,amount,newBalance]
    );

    return newBalance;
};


module.exports = {
    withdrawFromAccount,
    depositToAccount
};