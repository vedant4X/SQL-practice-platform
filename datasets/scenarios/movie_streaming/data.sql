INSERT INTO streaming_users VALUES
(1, 'neo_matrix', 'neo@zion.net', 'USA', '2021-01-15'),
(2, 'trinity_z', 'trinity@zion.net', 'USA', '2021-02-10'),
(3, 'morpheus', 'morpheus@zion.net', 'USA', '2021-03-01'),
(4, 'cypher', 'cypher@zion.net', 'UK', '2022-04-18'),
(5, 'oracle', 'oracle@matrix.net', 'Canada', '2022-09-05');

INSERT INTO movies VALUES
(1, 'Interstellar', 'Sci-Fi', 2014, 169, 8.7),
(2, 'Inception', 'Sci-Fi', 2010, 148, 8.8),
(3, 'The Dark Knight', 'Action', 2008, 152, 9.0),
(4, 'Pulp Fiction', 'Crime', 1994, 154, 8.9),
(5, 'Spirited Away', 'Animation', 2001, 125, 8.6),
(6, 'Parasite', 'Thriller', 2019, 132, 8.5);

INSERT INTO subscriptions VALUES
(1, 1, 'premium', 19.99, 'active'),
(2, 2, 'premium', 19.99, 'active'),
(3, 3, 'standard', 14.99, 'active'),
(4, 4, 'basic', 9.99, 'cancelled'),
(5, 5, 'standard', 14.99, 'active');

INSERT INTO watch_history VALUES
(1, 1, 1, '2023-01-10 20:00:00', 100),
(2, 1, 2, '2023-01-15 21:30:00', 95),
(3, 2, 1, '2023-01-18 19:00:00', 100),
(4, 2, 3, '2023-02-01 22:00:00', 80),
(5, 3, 5, '2023-02-14 18:30:00', 100),
(6, 4, 4, '2023-03-01 23:00:00', 45),
(7, 5, 6, '2023-03-15 20:15:00', 100),
(8, 1, 3, '2023-04-02 21:00:00', 100);
