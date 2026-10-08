-- ECommerceDB Visible Sample Dataset
-- Includes intentional edge cases: customers without orders, products with 0 reviews, refunded orders

INSERT INTO categories (category_id, category_name, parent_category_id) VALUES
(1, 'Electronics', NULL),
(2, 'Computers', 1),
(3, 'Smartphones', 1),
(4, 'Audio', 1),
(5, 'Home & Kitchen', NULL),
(6, 'Coffee & Tea', 5),
(7, 'Apparel', NULL);

INSERT INTO customers (customer_id, first_name, last_name, email, country, city, created_at) VALUES
(1, 'Liam', 'Miller', 'liam.m@email.com', 'USA', 'Seattle', '2022-01-15 10:00:00'),
(2, 'Emma', 'Watson', 'emma.w@email.com', 'UK', 'London', '2022-02-20 14:30:00'),
(3, 'Noah', 'Schneider', 'noah.s@email.de', 'Germany', 'Berlin', '2022-03-05 09:15:00'),
(4, 'Ava', 'Dubois', 'ava.d@email.fr', 'France', 'Paris', '2022-04-12 16:45:00'),
(5, 'Lucas', 'Rossi', 'lucas.r@email.it', 'Italy', 'Rome', '2022-05-18 11:20:00'),
(6, 'Mia', 'Tanaka', 'mia.t@email.jp', 'Japan', 'Tokyo', '2022-06-22 08:00:00'),
(7, 'Ethan', 'Hunt', 'ethan.h@email.com', 'USA', 'Chicago', '2022-07-01 13:10:00'),
(8, 'Chloe', 'Bennett', 'chloe.b@email.com', 'USA', 'Austin', '2022-08-14 15:30:00'),
(9, 'Oliver', 'Brown', 'oliver.b@email.ca', 'Canada', 'Toronto', '2022-09-09 17:00:00'),
(10, 'Zoe', 'Kovacs', 'zoe.k@email.com', 'USA', 'Denver', '2022-10-01 12:00:00'); -- Customer with 0 orders

INSERT INTO products (product_id, product_name, category_id, price, cost, stock_quantity, is_active) VALUES
(1, 'Pro Laptop 15-inch', 2, 1299.99, 900.00, 45, TRUE),
(2, 'Ultra Wireless Headphones', 4, 199.99, 80.00, 120, TRUE),
(3, 'Smart Flagship Phone 128GB', 3, 899.99, 550.00, 80, TRUE),
(4, 'Mechanical Gaming Keyboard', 2, 129.99, 55.00, 200, TRUE),
(5, '4K Ultra Gaming Monitor 27-inch', 2, 399.99, 240.00, 35, TRUE),
(6, 'Artisan Espresso Machine', 6, 499.99, 260.00, 25, TRUE),
(7, 'Pour Over Glass Dripper', 6, 29.99, 10.00, 150, TRUE),
(8, 'Organic Ethiopian Coffee Beans 1kg', 6, 24.99, 9.00, 300, TRUE),
(9, 'Noise-Cancelling Earbuds', 4, 149.99, 60.00, 90, TRUE),
(10, 'Vintage Leather Jacket', 7, 249.99, 110.00, 15, FALSE), -- Inactive product
(11, 'Bluetooth Portable Speaker', 4, 79.99, 32.00, 180, TRUE); -- Product with 0 orders

INSERT INTO orders (order_id, customer_id, order_date, order_status, total_amount) VALUES
(1001, 1, '2023-01-10', 'completed', 1499.98),
(1002, 2, '2023-01-15', 'completed', 899.99),
(1003, 3, '2023-01-20', 'completed', 529.98),
(1004, 1, '2023-02-02', 'completed', 199.99),
(1005, 4, '2023-02-14', 'refunded', 1299.99),
(1006, 5, '2023-02-18', 'cancelled', 399.99),
(1007, 6, '2023-03-01', 'completed', 124.97),
(1008, 7, '2023-03-15', 'completed', 1429.98),
(1009, 8, '2023-03-22', 'completed', 499.99),
(1010, 9, '2023-04-05', 'completed', 54.98),
(1011, 2, '2023-04-18', 'completed', 149.99),
(1012, 1, '2023-05-02', 'completed', 424.98);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price, discount) VALUES
(1, 1001, 1, 1, 1299.99, 0.00),
(2, 1001, 2, 1, 199.99, 0.00),
(3, 1002, 3, 1, 899.99, 0.00),
(4, 1003, 6, 1, 499.99, 0.00),
(5, 1003, 7, 1, 29.99, 0.00),
(6, 1004, 2, 1, 199.99, 0.00),
(7, 1005, 1, 1, 1299.99, 0.00),
(8, 1006, 5, 1, 399.99, 0.00),
(9, 1007, 7, 1, 29.99, 0.00),
(10, 1007, 8, 3, 24.99, 0.00),
(11, 1008, 1, 1, 1299.99, 0.00),
(12, 1008, 4, 1, 129.99, 0.00),
(13, 1009, 6, 1, 499.99, 0.00),
(14, 1010, 7, 1, 29.99, 0.00),
(15, 1010, 8, 1, 24.99, 0.00),
(16, 1011, 9, 1, 149.99, 0.00),
(17, 1012, 5, 1, 399.99, 0.00),
(18, 1012, 8, 1, 24.99, 0.00);

INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, processed_at) VALUES
(1, 1001, 'credit_card', 'success', 1499.98, '2023-01-10 10:05:00'),
(2, 1002, 'apple_pay', 'success', 899.99, '2023-01-15 14:20:00'),
(3, 1003, 'paypal', 'success', 529.98, '2023-01-20 09:30:00'),
(4, 1004, 'credit_card', 'success', 199.99, '2023-02-02 11:15:00'),
(5, 1005, 'credit_card', 'success', 1299.99, '2023-02-14 16:50:00'),
(6, 1006, 'paypal', 'failed', 399.99, '2023-02-18 11:25:00'),
(7, 1007, 'credit_card', 'success', 124.97, '2023-03-01 08:15:00'),
(8, 1008, 'credit_card', 'success', 1429.98, '2023-03-15 13:20:00'),
(9, 1009, 'apple_pay', 'success', 499.99, '2023-03-22 15:40:00'),
(10, 1010, 'credit_card', 'success', 54.98, '2023-04-05 17:10:00'),
(11, 1011, 'paypal', 'success', 149.99, '2023-04-18 12:05:00'),
(12, 1012, 'credit_card', 'success', 424.98, '2023-05-02 10:45:00');

INSERT INTO reviews (review_id, product_id, customer_id, rating, review_text, created_at) VALUES
(1, 1, 1, 5, 'Super fast laptop, crisp display and great build quality.', '2023-01-25 15:00:00'),
(2, 2, 1, 4, 'Very comfortable sound isolation, battery lasts 25 hours.', '2023-02-10 11:00:00'),
(3, 3, 2, 5, 'Best smartphone camera I have used so far.', '2023-01-28 18:30:00'),
(4, 6, 3, 5, 'Pulling café-quality espresso shots at home easily.', '2023-02-05 09:00:00'),
(5, 7, 6, 4, 'Clean extraction and easy to wash.', '2023-03-10 14:00:00'),
(6, 8, 6, 5, 'Floral aroma, medium roast, delicious note.', '2023-03-12 16:30:00'),
(7, 4, 7, 4, 'Clicky mechanical switches feel very responsive.', '2023-03-28 10:15:00'),
(8, 9, 2, 3, 'Decent audio, but ear tips slipped during workouts.', '2023-04-25 13:40:00');
