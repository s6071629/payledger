# PayLedger

### A Transaction-Safe Payments API with Double-Entry Ledgering

PayLedger is a backend payments system built using Node.js, Express.js, and MySQL.

The project provides APIs for user registration, account creation, deposits, withdrawals, and transfers while maintaining transaction records and an immutable ledger of account balance changes.

The system focuses on important backend concepts such as database transactions, row-level locking, idempotency, password hashing, REST APIs, and transactional consistency.

---

## Features

- User registration
- Password hashing using bcrypt
- Account creation
- Account balance management
- Deposit money
- Withdraw money
- Transfer money between accounts
- Transaction status tracking
- Idempotency keys to prevent duplicate transactions
- Transaction ledger
- Database transactions using MySQL
- Row-level locking using `SELECT ... FOR UPDATE`
- Transaction history
- RESTful API design
- JSON request/response handling

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MySQL 8 | Relational database |
| mysql2 | MySQL driver |
| bcrypt | Password hashing |
| Postman | API testing |

