INSERT INTO patients VALUES
(1, 'Grace Hopper', '1985-04-12', 'F', 'O+', '555-0101'),
(2, 'John Von Neumann', '1990-11-23', 'M', 'A+', '555-0102'),
(3, 'Barbara Liskov', '1978-08-05', 'F', 'B+', '555-0103'),
(4, 'Donald Knuth', '1965-01-10', 'M', 'AB+', '555-0104'),
(5, 'Linus Torvalds', '1982-12-28', 'M', 'O-', '555-0105');

INSERT INTO doctors VALUES
(1, 'Dr. Gregory House', 'Diagnostic Medicine', 'Internal', 22),
(2, 'Dr. Allison Cameron', 'Immunology', 'Immunology', 8),
(3, 'Dr. Robert Chase', 'Intensive Care', 'Surgery', 10),
(4, 'Dr. James Wilson', 'Oncology', 'Oncology', 18);

INSERT INTO appointments VALUES
(1, 1, 1, '2023-01-15 09:00:00', 'completed', 'Acute intermittent porphyria'),
(2, 2, 2, '2023-01-20 11:30:00', 'completed', 'Severe allergic rhinitis'),
(3, 3, 1, '2023-02-05 14:00:00', 'completed', 'Lyme disease suspected'),
(4, 4, 4, '2023-02-18 10:00:00', 'completed', 'Benign lymphadenopathy'),
(5, 5, 3, '2023-03-01 15:30:00', 'cancelled', NULL),
(6, 1, 2, '2023-03-12 10:30:00', 'completed', 'Routine post-treatment follow-up');

INSERT INTO prescriptions VALUES
(1, 1, 'Hemin Infusion', '3mg/kg IV', 4),
(2, 2, 'Fexofenadine', '180mg Daily', 30),
(3, 3, 'Doxycycline', '100mg BID', 14),
(4, 4, 'Observation Only', 'None', 0);
