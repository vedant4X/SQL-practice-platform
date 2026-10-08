INSERT INTO restaurants VALUES (1, 'Burger Haven', 'American', 4.6, 'Austin');
INSERT INTO menu_items VALUES (1, 1, 'Double Smash Burger', 13.50, FALSE);
INSERT INTO delivery_drivers VALUES (1, 'Leo Vance', 'car', 4.8, TRUE);
INSERT INTO delivery_orders VALUES (101, 1, 1, 'Sam Wilson', '2023-07-01 18:00:00', 3.99, 17.49, 'delivered');
INSERT INTO delivery_order_items VALUES (1, 101, 1, 1, 13.50);
