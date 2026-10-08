INSERT INTO sales_reps VALUES
(1, 'Jordan Belfort', 'Northeast', 1000000.00, 0.08),
(2, 'Glengarry Ross', 'West', 1200000.00, 0.09),
(3, 'Shelley Levene', 'Midwest', 750000.00, 0.07);

INSERT INTO leads VALUES
(1, 1, 'Omni Consumer Products', 'Manufacturing', 'qualified'),
(2, 1, 'Initech Solutions', 'Technology', 'qualified'),
(3, 2, 'Cyberdyne Systems', 'Defense', 'qualified'),
(4, 2, 'Massive Dynamic', 'Research', 'qualified'),
(5, 3, 'Dunder Mifflin', 'Paper', 'lost');

INSERT INTO opportunities VALUES
(1, 1, 250000.00, 'closed_won', '2023-02-15'),
(2, 2, 85000.00, 'closed_won', '2023-03-10'),
(3, 3, 500000.00, 'closed_won', '2023-04-01'),
(4, 4, 150000.00, 'negotiation', '2023-06-30');

INSERT INTO contracts VALUES
(1, 1, '2023-02-15', 250000.00, 12),
(2, 2, '2023-03-10', 85000.00, 24),
(3, 3, '2023-04-01', 500000.00, 36);
