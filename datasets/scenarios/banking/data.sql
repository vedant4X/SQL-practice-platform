INSERT INTO bank_customers VALUES
(1, 'Alice Morgan', 'alice.m@bank.com', 760, '2021-03-10'),
(2, 'Bob Vance', 'bob.v@bank.com', 680, '2021-07-22'),
(3, 'Charlie Day', 'charlie.d@bank.com', 720, '2022-01-15'),
(4, 'Dana Scully', 'dana.s@bank.com', 810, '2022-05-18'),
(5, 'Fox Mulder', 'fox.m@bank.com', 620, '2023-02-01');

INSERT INTO branches VALUES
(1, 'Metro Downtown', 'New York', 85000000.00),
(2, 'West Coast Hub', 'San Francisco', 92000000.00),
(3, 'Windy City Branch', 'Chicago', 64000000.00);

INSERT INTO accounts VALUES
(101, 1, 1, 'checking', 14500.00, '2021-03-10 10:00:00'),
(102, 1, 1, 'savings', 52000.00, '2021-04-01 11:30:00'),
(103, 2, 2, 'checking', 3400.00, '2021-07-22 09:15:00'),
(104, 3, 3, 'checking', 8900.00, '2022-01-15 14:00:00'),
(105, 4, 1, 'savings', 125000.00, '2022-05-18 16:45:00'),
(106, 5, 2, 'checking', 850.00, '2023-02-01 13:20:00');

INSERT INTO transactions VALUES
(1, 101, 'deposit', 5000.00, '2023-01-10 09:30:00', 'completed'),
(2, 101, 'withdrawal', 1200.00, '2023-01-15 14:10:00', 'completed'),
(3, 102, 'deposit', 10000.00, '2023-02-01 11:00:00', 'completed'),
(4, 103, 'withdrawal', 500.00, '2023-02-14 16:30:00', 'completed'),
(5, 104, 'deposit', 3200.00, '2023-03-05 10:15:00', 'completed'),
(6, 105, 'deposit', 25000.00, '2023-03-20 12:45:00', 'completed'),
(7, 106, 'withdrawal', 300.00, '2023-04-01 15:00:00', 'completed');
