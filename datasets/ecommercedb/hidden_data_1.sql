-- ECommerceDB Alternate Dataset 1 (Hidden Test Case 1)
-- Different distribution of orders and customer countries

INSERT INTO categories (category_id, category_name, parent_category_id) VALUES
(1, 'Electronics', NULL),
(2, 'Computers', 1),
(3, 'Smartphones', 1),
(4, 'Audio', 1),
(5, 'Home & Kitchen', NULL),
(6, 'Coffee & Tea', 5),
(7, 'Apparel', NULL);

INSERT INTO customers (customer_id, first_name, last_name, email, country, city, created_at) VALUES
(1, 'Sara', 'Conor', 'sara.c@email.com', 'USA', 'Los Angeles', '2022-01-10 11:00:00'),
(2, 'John', 'Connor', 'john.c@email.com', 'USA', 'San Francisco', '2022-02-15 15:30:00'),
(3, 'Kyle', 'Reese', 'kyle.r@email.com', 'USA', 'Dallas', '2022-03-20 10:15:00'),
(4, 'Miles', 'Dyson', 'miles.d@email.com', 'USA', 'Palo Alto', '2022-04-25 14:45:00'),
(5, 'T-800', 'Model', 'cyberdyne@email.com', 'Austria', 'Vienna', '2022-05-30 08:00:00');

INSERT INTO products (product_id, product_name, category_id, price, cost, stock_quantity, is_active) VALUES
(1, 'Pro Laptop 15-inch', 2, 1299.99, 900.00, 20, TRUE),
(2, 'Ultra Wireless Headphones', 4, 199.99, 80.00, 50, TRUE),
(3, 'Smart Flagship Phone 128GB', 3, 899.99, 550.00, 30, TRUE),
(4, 'Mechanical Gaming Keyboard', 2, 129.99, 55.00, 75, TRUE),
(5, '4K Ultra Gaming Monitor 27-inch', 2, 399.99, 240.00, 10, TRUE),
(6, 'Artisan Espresso Machine', 6, 499.99, 260.00, 15, TRUE),
(7, 'Pour Over Glass Dripper', 6, 29.99, 10.00, 80, TRUE),
(8, 'Organic Ethiopian Coffee Beans 1kg', 6, 24.99, 9.00, 150, TRUE),
(9, 'Noise-Cancelling Earbuds', 4, 149.99, 60.00, 40, TRUE),
(10, 'Vintage Leather Jacket', 7, 249.99, 110.00, 5, FALSE),
(11, 'Bluetooth Portable Speaker', 4, 79.99, 32.00, 90, TRUE);

INSERT INTO orders (order_id, customer_id, order_date, order_status, total_amount) VALUES
(2001, 1, '2023-01-05', 'completed', 1299.99),
(2002, 2, '2023-01-18', 'completed', 399.99),
(2003, 3, '2023-02-10', 'completed', 199.99),
(2004, 1, '2023-03-01', 'completed', 499.99),
(2005, 4, '2023-03-15', 'cancelled', 899.99);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, discount) VALUES
(1, 2001, 1, 1, 1299.99, 0.00),
(2, 2002, 5, 1, 399.99, 0.00),
(3, 2003, 2, 1, 199.99, 0.00),
(4, 2004, 6, 1, 499.99, 0.00),
(5, 2005, 3, 1, 899.99, 0.00);

INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, processed_at) VALUES
(1, 2001, 'credit_card', 'success', 1299.99, '2023-01-05 11:05:00'),
(2, 2002, 'paypal', 'success', 399.99, '2023-01-18 15:35:00'),
(3, 2003, 'apple_pay', 'success', 199.99, '2023-02-10 10:20:00'),
(4, 2004, 'credit_card', 'success', 499.99, '2023-03-01 14:50:00'),
(5, 2005, 'credit_card', 'failed', 899.99, '2023-03-15 09:00:00');

INSERT INTO reviews (review_id, product_id, customer_id, rating, review_text, created_at) VALUES
(1, 1, 1, 5, 'Exceptional performance.', '2023-01-15 12:00:00'),
(2, 5, 2, 4, 'High refresh rate is great.', '2023-01-25 18:00:00');
