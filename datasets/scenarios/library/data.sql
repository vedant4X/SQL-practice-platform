INSERT INTO authors VALUES
(1, 'George Orwell', 'British'),
(2, 'Gabriel Garcia Marquez', 'Colombian'),
(3, 'Haruki Murakami', 'Japanese'),
(4, 'Jane Austen', 'British'),
(5, 'Isaac Asimov', 'American');

INSERT INTO books VALUES
(1, '1984', 1, 'Dystopian', 1949, 3),
(2, 'Animal Farm', 1, 'Satire', 1945, 2),
(3, 'One Hundred Years of Solitude', 2, 'Magic Realism', 1967, 1),
(4, 'Norwegian Wood', 3, 'Literary Fiction', 1987, 4),
(5, 'Pride and Prejudice', 4, 'Romance', 1813, 2),
(6, 'Foundation', 5, 'Sci-Fi', 1951, 3);

INSERT INTO members VALUES
(1, 'Leo Tolstoy', 'leo@writers.org', '2022-01-10', 'active'),
(2, 'Virginia Woolf', 'virginia@writers.org', '2022-03-15', 'active'),
(3, 'Franz Kafka', 'franz@writers.org', '2022-06-20', 'active'),
(4, 'Emily Dickinson', 'emily@writers.org', '2023-01-05', 'active');

INSERT INTO book_loans VALUES
(1, 1, 1, '2023-02-01', '2023-02-15', '2023-02-14'),
(2, 3, 2, '2023-02-10', '2023-02-24', '2023-02-22'),
(3, 4, 3, '2023-03-01', '2023-03-15', NULL), -- Currently borrowed/overdue
(4, 6, 1, '2023-03-10', '2023-03-24', '2023-03-20'),
(5, 5, 4, '2023-04-05', '2023-04-19', NULL);
