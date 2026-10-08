INSERT INTO bank_customers VALUES
(1, 'Tony Soprano', 'tony@bada.com', 710, '2021-01-10'),
(2, 'Paulie Gualtieri', 'paulie@bada.com', 590, '2021-04-12');
INSERT INTO branches VALUES (1, 'North Jersey', 'Newark', 45000000.00);
INSERT INTO accounts VALUES
(101, 1, 1, 'checking', 45000.00, '2021-01-10 10:00:00'),
(102, 2, 1, 'savings', 12000.00, '2021-04-12 11:00:00');
INSERT INTO transactions VALUES
(1, 101, 'deposit', 20000.00, '2023-01-05 10:00:00', 'completed'),
(2, 102, 'withdrawal', 1000.00, '2023-02-10 14:00:00', 'completed');
