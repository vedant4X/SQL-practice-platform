INSERT INTO airports VALUES
('JFK', 'John F. Kennedy International', 'New York', 'USA'),
('LHR', 'Heathrow Airport', 'London', 'UK'),
('HND', 'Haneda Airport', 'Tokyo', 'Japan'),
('ORD', 'OHare International', 'Chicago', 'USA'),
('CDG', 'Charles de Gaulle', 'Paris', 'France');

INSERT INTO passengers VALUES
(1, 'Benjamin', 'Franklin', 'P987654321', 45000),
(2, 'Amelia', 'Earhart', 'P123456789', 120000),
(3, 'Charles', 'Lindbergh', 'P555666777', 85000),
(4, 'Bessie', 'Coleman', 'P444333222', 62000),
(5, 'Howard', 'Hughes', 'P111222333', 190000);

INSERT INTO flights VALUES
(1, 'AA100', 'JFK', 'LHR', '2023-05-10 18:30:00', '2023-05-11 06:45:00', 750.00, 'on_time'),
(2, 'BA202', 'LHR', 'JFK', '2023-05-15 10:00:00', '2023-05-15 13:15:00', 820.00, 'on_time'),
(3, 'JL005', 'JFK', 'HND', '2023-06-01 12:00:00', '2023-06-02 15:30:00', 1250.00, 'on_time'),
(4, 'UA440', 'ORD', 'LHR', '2023-06-10 21:00:00', '2023-06-11 10:45:00', 690.00, 'delayed'),
(5, 'AF022', 'JFK', 'CDG', '2023-06-20 19:15:00', '2023-06-21 08:30:00', 780.00, 'cancelled');

INSERT INTO bookings VALUES
(1, 1, '2023-04-01 14:00:00', 750.00, 'confirmed'),
(2, 2, '2023-04-05 11:20:00', 2500.00, 'confirmed'),
(3, 3, '2023-04-12 16:45:00', 1250.00, 'confirmed'),
(4, 4, '2023-05-01 09:30:00', 690.00, 'confirmed'),
(5, 5, '2023-05-10 15:10:00', 780.00, 'cancelled');

INSERT INTO tickets VALUES
(1, 1, 1, '14B', 'economy'),
(2, 2, 1, '2A', 'business'),
(3, 2, 2, '2A', 'business'),
(4, 3, 3, '12F', 'economy'),
(5, 4, 4, '22C', 'economy');
