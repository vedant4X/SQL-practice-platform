INSERT INTO hotels VALUES
(1, 'Grand Palace Hotel', 'Paris', 5),
(2, 'Boutique Canal Inn', 'Amsterdam', 4),
(3, 'Alpine Mountain Lodge', 'Zurich', 4);

INSERT INTO rooms VALUES
(1, 1, '101', 'standard', 220.00, TRUE),
(2, 1, '201', 'deluxe', 380.00, TRUE),
(3, 1, 'PH1', 'suite', 850.00, TRUE),
(4, 2, '12', 'standard', 160.00, TRUE),
(5, 2, '24', 'deluxe', 240.00, TRUE),
(6, 3, '105', 'standard', 200.00, TRUE);

INSERT INTO hotel_guests VALUES
(1, 'Victor', 'Hugo', 'victor@hugo.fr', '555-0011'),
(2, 'Vincent', 'Van Gogh', 'vincent@art.nl', '555-0022'),
(3, 'Albert', 'Einstein', 'albert@phys.ch', '555-0033'),
(4, 'Marie', 'Curie', 'marie@curie.fr', '555-0044');

INSERT INTO reservations VALUES
(1, 1, 2, '2023-04-10', '2023-04-14', 1520.00, 'checked_out'),
(2, 2, 4, '2023-04-15', '2023-04-18', 480.00, 'checked_out'),
(3, 3, 6, '2023-05-01', '2023-05-05', 800.00, 'checked_out'),
(4, 4, 3, '2023-06-10', '2023-06-13', 2550.00, 'confirmed'),
(5, 1, 1, '2023-07-01', '2023-07-03', 440.00, 'cancelled');

INSERT INTO room_services VALUES
(1, 1, 'breakfast', 45.00, '2023-04-11 08:30:00'),
(2, 1, 'laundry', 30.00, '2023-04-12 11:00:00'),
(3, 3, 'spa', 120.00, '2023-05-02 16:00:00'),
(4, 4, 'breakfast', 55.00, '2023-06-11 09:00:00');
