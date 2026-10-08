INSERT INTO job_postings VALUES
(1, 'Senior Data Engineer', 'Data', 5, 175000.00, '2023-01-10'),
(2, 'Backend Architect', 'Engineering', 8, 210000.00, '2023-01-15'),
(3, 'Product Designer', 'Design', 4, 140000.00, '2023-02-01');

INSERT INTO applicants VALUES
(1, 'Maya', 'Lin', 'maya.lin@email.com', 6, 'FinTech Corp'),
(2, 'Liam', 'Chen', 'liam.chen@email.com', 9, 'CloudScale Systems'),
(3, 'Aria', 'Montgomery', 'aria.m@email.com', 4, 'Creative Studio'),
(4, 'Jon', 'Snow', 'jon.snow@email.com', 3, 'North Logistics');

INSERT INTO interview_stages VALUES
(1, 1, 1, 'technical', 5, '2023-01-20 14:00:00'),
(2, 1, 1, 'system_design', 4, '2023-01-25 15:30:00'),
(3, 2, 2, 'technical', 5, '2023-01-28 11:00:00'),
(4, 2, 2, 'system_design', 5, '2023-02-05 16:00:00'),
(5, 3, 3, 'portfolio_review', 4, '2023-02-12 10:00:00');

INSERT INTO job_offers VALUES
(1, 1, 1, 170000.00, 'accepted'),
(2, 2, 2, 205000.00, 'accepted');
