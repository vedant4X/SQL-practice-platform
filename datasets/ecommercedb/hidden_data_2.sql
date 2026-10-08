-- ECommerceDB Alternate Dataset 2 (Hidden Test Case 2)
-- Tests empty order table cases and boundary discounts

INSERT INTO categories (category_id, category_name, parent_category_id) VALUES
(1, 'Electronics', NULL),
(2, 'Computers', 1),
(3, 'Smartphones', 1),
(4, 'Audio', 1),
(5, 'Home & Kitchen', NULL),
(6, 'Coffee & Tea', 5),
(7, 'Apparel', NULL);

INSERT INTO customers (customer_id, first_name, last_name, email, country, city, created_at) VALUES
(1, 'Tony', 'Stark', 'tony@stark.com', 'USA', 'New York', '2021-01-01 00:00:00'),
(2, 'Pepper', 'Potts', 'pepper@stark.com', 'USA', 'New York', '2021-02-01 00:00:00');

INSERT INTO products (product_id, product_name, category_id, price, cost, stock_quantity, is_active) VALUES
(1, 'Pro Laptop 15-inch', 2, 1299.99, 900.00, 10, TRUE),
(2, 'Ultra Wireless Headphones', 4, 199.99, 80.00, 20, TRUE),
(3, 'Smart Flagship Phone 128GB', 3, 899.99, 550.00, 15, TRUE),
(4, 'Mechanical Gaming Keyboard', 2, 129.99, 55.00, 30, TRUE),
(5, '4K Ultra Gaming Monitor 27-inch', 2, 399.99, 240.00, 5, TRUE),
(6, 'Artisan Espresso Machine', 6, 499.99, 260.00, 10, TRUE),
(7, 'Pour Over Glass Dripper', 6, 29.99, 10.00, 50, TRUE),
(8, 'Organic Ethiopian Coffee Beans 1kg', 6, 24.99, 9.00, 100, TRUE),
(9, 'Noise-Cancelling Earbuds', 4, 149.99, 60.00, 25, TRUE),
(10, 'Vintage Leather Jacket', 7, 249.99, 110.00, 2, FALSE),
(11, 'Bluetooth Portable Speaker', 4, 79.99, 32.00, 40, TRUE);

INSERT INTO orders (order_id, customer_id, order_date, order_status, total_amount) VALUES
(3001, 1, '2023-05-01', 'completed', 149.99);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, discount) VALUES
(1, 3001, 9, 1, 149.99, 0.00);

INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, processed_at) VALUES
(1, 3001, 'credit_card', 'success', 149.99, '2023-05-01 12:00:00');

INSERT INTO reviews (review_id, product_id, customer_id, rating, review_text, created_at) VALUES
(1, 9, 1, 4, 'Solid sound.', '2023-05-02 10:00:00');
