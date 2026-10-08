DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS bank_customers CASCADE;

CREATE TABLE bank_customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    credit_score INT NOT NULL,
    joined_date DATE NOT NULL
);

CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    total_assets NUMERIC(14, 2) NOT NULL
);

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES bank_customers(customer_id),
    branch_id INT NOT NULL REFERENCES branches(branch_id),
    account_type VARCHAR(20) NOT NULL, -- 'checking', 'savings', 'money_market'
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id),
    transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
    amount NUMERIC(10, 2) NOT NULL,
    tx_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
);
