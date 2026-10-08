DROP TABLE IF EXISTS delivery_order_items CASCADE;
DROP TABLE IF EXISTS delivery_orders CASCADE;
DROP TABLE IF EXISTS delivery_drivers CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cuisine VARCHAR(50) NOT NULL,
    rating NUMERIC(2, 1) NOT NULL,
    city VARCHAR(50) NOT NULL
);

CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id),
    item_name VARCHAR(100) NOT NULL,
    price NUMERIC(8, 2) NOT NULL,
    is_vegetarian BOOLEAN DEFAULT FALSE
);

CREATE TABLE delivery_drivers (
    driver_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL, -- 'bike', 'scooter', 'car'
    rating NUMERIC(2, 1) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE delivery_orders (
    order_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id),
    driver_id INT REFERENCES delivery_drivers(driver_id),
    customer_name VARCHAR(100) NOT NULL,
    order_timestamp TIMESTAMP NOT NULL,
    delivery_fee NUMERIC(5, 2) NOT NULL,
    total_amount NUMERIC(8, 2) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL -- 'delivered', 'in_transit', 'cancelled'
);

CREATE TABLE delivery_order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES delivery_orders(order_id),
    item_id INT NOT NULL REFERENCES menu_items(item_id),
    quantity INT NOT NULL,
    item_price NUMERIC(8, 2) NOT NULL
);
