INSERT INTO restaurants VALUES
(1, 'Napoli Woodfire Pizza', 'Italian', 4.8, 'Chicago'),
(2, 'Tokyo Ramen Bar', 'Japanese', 4.9, 'Chicago'),
(3, 'Taco Fiesta', 'Mexican', 4.5, 'Chicago'),
(4, 'Green Lotus Vegan', 'Vegan', 4.7, 'Chicago');

INSERT INTO menu_items VALUES
(1, 1, 'Margherita Pizza', 16.50, TRUE),
(2, 1, 'Truffle Mushroom Pizza', 21.00, TRUE),
(3, 1, 'Diavola Pepperoni', 19.00, FALSE),
(4, 2, 'Tonkotsu Ramen', 15.50, FALSE),
(5, 2, 'Spicy Miso Ramen', 16.00, FALSE),
(6, 2, 'Gyoza Dumplings', 8.50, FALSE),
(7, 3, 'Street Tacos Trio', 12.00, FALSE),
(8, 3, 'Guacamole & Chips', 7.50, TRUE),
(9, 4, 'Buddha Bowl', 14.00, TRUE);

INSERT INTO delivery_drivers VALUES
(1, 'Carlos Ramirez', 'bike', 4.9, TRUE),
(2, 'Sarah Jenkins', 'scooter', 4.8, TRUE),
(3, 'Michael Chang', 'car', 4.7, TRUE),
(4, 'David Patel', 'bike', 4.5, FALSE);

INSERT INTO delivery_orders VALUES
(101, 1, 1, 'Emily Watson', '2023-06-01 18:30:00', 3.99, 37.50, 'delivered'),
(102, 2, 2, 'James Bond', '2023-06-01 19:15:00', 4.99, 31.50, 'delivered'),
(103, 3, 1, 'Clark Kent', '2023-06-02 12:45:00', 2.99, 19.50, 'delivered'),
(104, 1, 3, 'Bruce Wayne', '2023-06-02 20:10:00', 3.99, 40.00, 'delivered'),
(105, 4, 2, 'Diana Prince', '2023-06-03 13:00:00', 3.50, 17.50, 'delivered'),
(106, 2, NULL, 'Peter Parker', '2023-06-03 19:30:00', 4.99, 32.00, 'cancelled');

INSERT INTO delivery_order_items VALUES
(1, 101, 1, 1, 16.50),
(2, 101, 2, 1, 21.00),
(3, 102, 4, 2, 15.50),
(4, 103, 7, 1, 12.00),
(5, 103, 8, 1, 7.50),
(6, 104, 2, 1, 21.00),
(7, 104, 3, 1, 19.00),
(8, 105, 9, 1, 14.00);
