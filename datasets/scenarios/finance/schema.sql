DROP TABLE IF EXISTS dividends CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;

CREATE TABLE portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    risk_tolerance VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high'
    created_at DATE NOT NULL
);

CREATE TABLE stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE trades (
    trade_id SERIAL PRIMARY KEY,
    portfolio_id INT NOT NULL REFERENCES portfolios(portfolio_id),
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    trade_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    shares INT NOT NULL,
    price_per_share NUMERIC(10, 2) NOT NULL,
    trade_date TIMESTAMP NOT NULL
);

CREATE TABLE dividends (
    dividend_id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    amount_per_share NUMERIC(6, 2) NOT NULL,
    payout_date DATE NOT NULL
);
