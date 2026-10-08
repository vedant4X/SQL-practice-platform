-- EmployeeDB Sample Dataset (Visible Test Case)
-- Includes deliberate edge cases: NULL manager_id, NULL end_date, salary ties, departments without projects

INSERT INTO departments (dept_id, dept_name, location, budget) VALUES
(1, 'Engineering', 'San Francisco', 1500000.00),
(2, 'Product', 'New York', 800000.00),
(3, 'Sales', 'Chicago', 1200000.00),
(4, 'Marketing', 'Austin', 600000.00),
(5, 'Human Resources', 'Denver', 400000.00),
(6, 'Legal', 'Boston', 500000.00); -- department with no employees

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, job_title, salary, manager_id, dept_id) VALUES
(1, 'Eleanor', 'Vance', 'eleanor.vance@company.com', '2020-01-15', 'Chief Executive Officer', 240000.00, NULL, 1),
(2, 'Marcus', 'Brody', 'marcus.brody@company.com', '2020-03-01', 'VP of Engineering', 185000.00, 1, 1),
(3, 'Sophia', 'Chen', 'sophia.chen@company.com', '2020-06-15', 'Principal Engineer', 160000.00, 2, 1),
(4, 'Liam', 'OConnor', 'liam.oconnor@company.com', '2021-02-10', 'Senior Software Engineer', 135000.00, 3, 1),
(5, 'Amina', 'Diallo', 'amina.diallo@company.com', '2021-05-18', 'Senior Software Engineer', 135000.00, 3, 1), -- Salary tie with Liam
(6, 'Carlos', 'Mendoza', 'carlos.mendoza@company.com', '2022-01-10', 'Software Engineer', 95000.00, 4, 1),
(7, 'Devon', 'Miles', 'devon.miles@company.com', '2022-08-20', 'Junior Engineer', 75000.00, 4, 1),
(8, 'Rachel', 'Green', 'rachel.green@company.com', '2020-04-12', 'VP of Product', 175000.00, 1, 2),
(9, 'Kenji', 'Sato', 'kenji.sato@company.com', '2021-09-01', 'Lead Product Manager', 140000.00, 8, 2),
(10, 'Maya', 'Patel', 'maya.patel@company.com', '2022-03-15', 'Product Manager', 110000.00, 9, 2),
(11, 'David', 'Kim', 'david.kim@company.com', '2020-05-01', 'VP of Sales', 170000.00, 1, 3),
(12, 'Sarah', 'Jenkins', 'sarah.jenkins@company.com', '2021-07-15', 'Enterprise Account Exec', 125000.00, 11, 3),
(13, 'James', 'Wilson', 'james.wilson@company.com', '2022-02-01', 'Account Executive', 85000.00, 12, 3),
(14, 'Olivia', 'Taylor', 'olivia.taylor@company.com', '2021-01-20', 'Head of Marketing', 145000.00, 1, 4),
(15, 'Lucas', 'Silva', 'lucas.silva@company.com', '2022-04-10', 'Growth Marketer', 88000.00, 14, 4),
(16, 'Hannah', 'Abbott', 'hannah.abbott@company.com', '2021-11-05', 'HR Director', 130000.00, 1, 5),
(17, 'Arthur', 'Dent', 'arthur.dent@company.com', '2023-01-09', 'Contract Contractor', 65000.00, NULL, NULL); -- Employee without department

INSERT INTO projects (project_id, project_name, dept_id, start_date, end_date, budget) VALUES
(101, 'Cloud Migration', 1, '2021-01-10', '2022-06-30', 500000.00),
(102, 'NextGen Mobile App', 1, '2022-03-01', NULL, 750000.00), -- Ongoing project
(103, 'AI Recommendation Engine', 1, '2023-01-15', NULL, 600000.00),
(104, 'Global Sales Expansion', 3, '2022-05-01', '2023-04-30', 350000.00),
(105, 'Brand Relaunch', 4, '2022-09-01', '2023-03-15', 200000.00);

INSERT INTO assignments (assignment_id, emp_id, project_id, role, hours_worked, rating) VALUES
(1, 3, 101, 'Tech Lead', 450.0, 4.9),
(2, 4, 101, 'Backend Dev', 620.0, 4.7),
(3, 5, 101, 'Infrastructure', 580.0, 4.8),
(4, 3, 102, 'Architect', 310.0, 5.0),
(5, 6, 102, 'Fullstack Dev', 540.0, 4.2),
(6, 7, 102, 'QA / Testing', 410.0, 4.0),
(7, 9, 102, 'Product Owner', 280.0, 4.6),
(8, 4, 103, 'Core ML Engineer', 210.0, 4.8),
(9, 12, 104, 'Regional Lead', 390.0, 4.5),
(10, 13, 104, 'SDR Support', 450.0, 3.9),
(11, 15, 105, 'Campaign Lead', 320.0, 4.3);

INSERT INTO salaries_history (history_id, emp_id, effective_date, salary, change_reason) VALUES
(1, 4, '2021-02-10', 115000.00, 'Starting Salary'),
(2, 4, '2022-02-10', 125000.00, 'Annual Merit Raise'),
(3, 4, '2023-02-10', 135000.00, 'Promotion to Senior'),
(4, 5, '2021-05-18', 120000.00, 'Starting Salary'),
(5, 5, '2022-05-18', 135000.00, 'Market Adjustment'),
(6, 6, '2022-01-10', 90000.00, 'Starting Salary'),
(7, 6, '2023-01-10', 95000.00, 'Annual Merit Raise');
