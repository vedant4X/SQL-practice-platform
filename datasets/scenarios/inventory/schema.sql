DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(50) NOT NULL,
    capacity INT NOT NULL
);

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL
);

CREATE TABLE stock_items (
    item_id SERIAL PRIMARY KEY,
    warehouse_id INT NOT NULL REFERENCES warehouses(warehouse_id),
    supplier_id INT NOT NULL REFERENCES suppliers(supplier_id),
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    unit_cost NUMERIC(10, 2) NOT NULL
);

CREATE TABLE stock_transactions (
    tx_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES stock_items(item_id),
    transaction_type VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'adjustment'
    quantity INT NOT NULL,
    tx_date TIMESTAMP NOT NULL
);
