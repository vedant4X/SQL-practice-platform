INSERT INTO social_users VALUES
(1, 'tech_guru', 'Alex Rivera', 'Building distributed systems', '2021-01-10 10:00:00'),
(2, 'data_wiz', 'Clara Belle', 'SQL & Machine Learning advocate', '2021-02-15 11:30:00'),
(3, 'design_pro', 'Marcus Cole', 'UI/UX Designer & Typographer', '2021-03-20 14:15:00'),
(4, 'dev_sam', 'Samantha Fox', 'Full-stack explorer', '2022-01-05 09:00:00'),
(5, 'quiet_reader', 'David Ross', 'Bookworm & Coffee lover', '2022-05-12 16:45:00');

INSERT INTO posts VALUES
(1, 1, 'PostgreSQL 16 CTE optimization benchmarks are astonishing!', NULL, '2023-01-15 10:30:00'),
(2, 2, 'Top 5 window functions every analyst must master.', NULL, '2023-01-18 14:00:00'),
(3, 1, 'Docker vs Podman in 2024: my honest architectural takeaways.', NULL, '2023-02-01 09:15:00'),
(4, 3, 'Design systems should prioritize keyboard accessibility first.', NULL, '2023-02-10 16:20:00'),
(5, 4, 'Just solved my first 100 SQL interview challenges!', NULL, '2023-03-05 11:45:00');

INSERT INTO comments VALUES
(1, 1, 2, 'Completely agree, the planner handles inline materialization well!', '2023-01-15 11:00:00'),
(2, 1, 4, 'What hardware did you benchmark on?', '2023-01-15 12:15:00'),
(3, 2, 1, 'LAG and LEAD save hours of self-joins.', '2023-01-18 15:30:00'),
(4, 4, 1, 'Crucial for WCAG AA compliance.', '2023-02-10 17:00:00');

INSERT INTO likes VALUES
(1, 1, 2, '2023-01-15 10:45:00'),
(2, 1, 3, '2023-01-15 11:10:00'),
(3, 1, 4, '2023-01-15 12:00:00'),
(4, 2, 1, '2023-01-18 14:30:00'),
(5, 2, 4, '2023-01-18 15:00:00'),
(6, 5, 1, '2023-03-05 12:00:00'),
(7, 5, 2, '2023-03-05 12:30:00');

INSERT INTO follows VALUES
(2, 1, '2021-03-01 10:00:00'),
(3, 1, '2021-04-10 14:00:00'),
(4, 1, '2022-02-01 09:30:00'),
(1, 2, '2021-03-05 11:00:00'),
(4, 2, '2022-03-15 15:20:00'),
(1, 3, '2021-05-01 16:00:00');
