# PayLedger

### A Transaction-Safe Payments API with Double-Entry Ledgering

PayLedger is a backend payments system built using Node.js, Express.js, and MySQL.

The project provides APIs for user registration, account creation, deposits, withdrawals, and transfers while maintaining transaction records and an immutable ledger of account balance changes.

The system focuses on important backend concepts such as database transactions, row-level locking, idempotency, password hashing, REST APIs, and transactional consistency.

---

## Features

-  User registration with bcrypt password hashing
- JWT-based authentication and authorization
- Account creation and balance management
- Deposits, withdrawals, and account-to-account transfers
- Transaction ledger and history with status tracking
- Idempotency keys to prevent duplicate transactions
- MySQL database transactions and row-level locking (SELECT ... FOR UPDATE)
- RESTful APIs with JSON request/response handling

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MySQL 8 | Relational database |
| mysql2 | MySQL driver |
| bcrypt | Password hashing |
| Postman | API testing, Authorization |

