INSERT INTO portfolios VALUES
(1, 'Warren Buffet Fund', 'moderate', '2021-01-01'),
(2, 'Tech Growth Trust', 'high', '2021-06-15'),
(3, 'Conservative Income Shield', 'low', '2022-01-10');

INSERT INTO stocks VALUES
('AAPL', 'Apple Inc', 'Technology', 185.50),
('MSFT', 'Microsoft Corp', 'Technology', 415.20),
('JNJ', 'Johnson & Johnson', 'Healthcare', 155.00),
('KO', 'The Coca-Cola Co', 'Consumer Defensive', 62.40),
('NVDA', 'NVIDIA Corp', 'Technology', 890.00);

INSERT INTO trades VALUES
(1, 1, 'AAPL', 'BUY', 500, 150.00, '2022-03-10 10:00:00'),
(2, 1, 'KO', 'BUY', 1000, 58.00, '2022-04-15 11:30:00'),
(3, 2, 'NVDA', 'BUY', 200, 420.00, '2022-08-01 14:15:00'),
(4, 2, 'MSFT', 'BUY', 300, 310.00, '2022-10-05 09:45:00'),
(5, 3, 'JNJ', 'BUY', 800, 160.00, '2023-01-20 13:00:00'),
(6, 2, 'NVDA', 'SELL', 50, 780.00, '2023-05-15 15:30:00');

INSERT INTO dividends VALUES
(1, 'AAPL', 0.24, '2023-02-15'),
(2, 'KO', 0.46, '2023-04-01'),
(3, 'JNJ', 1.19, '2023-03-10'),
(4, 'MSFT', 0.75, '2023-03-14');
