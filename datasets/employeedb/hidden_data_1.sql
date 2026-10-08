-- EmployeeDB Alternate Dataset 1 (Hidden Test Case 1)
-- Different values, different hierarchy, tests ties and empty department logic

INSERT INTO departments (dept_id, dept_name, location, budget) VALUES
(1, 'Engineering', 'Seattle', 2200000.00),
(2, 'Product', 'Boston', 950000.00),
(3, 'Sales', 'Atlanta', 1100000.00),
(4, 'Marketing', 'London', 750000.00),
(5, 'Human Resources', 'Paris', 350000.00),
(6, 'Research & Development', 'Berlin', 800000.00);

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, job_title, salary, manager_id, dept_id) VALUES
(1, 'Gwen', 'Stacy', 'gwen.stacy@company.com', '2019-03-01', 'Chief Executive Officer', 260000.00, NULL, 1),
(2, 'Peter', 'Parker', 'peter.parker@company.com', '2019-06-15', 'VP of Engineering', 190000.00, 1, 1),
(3, 'Miles', 'Morales', 'miles.morales@company.com', '2020-01-20', 'Principal Engineer', 165000.00, 2, 1),
(4, 'Otto', 'Octavius', 'otto.octavius@company.com', '2020-08-11', 'Senior Software Engineer', 145000.00, 3, 1),
(5, 'Felicia', 'Hardy', 'felicia.hardy@company.com', '2021-02-14', 'Senior Software Engineer', 145000.00, 3, 1), -- Tie
(6, 'Norman', 'Osborn', 'norman.osborn@company.com', '2019-09-01', 'VP of Product', 180000.00, 1, 2),
(7, 'Harry', 'Osborn', 'harry.osborn@company.com', '2021-04-10', 'Product Manager', 115000.00, 6, 2),
(8, 'Ned', 'Leeds', 'ned.leeds@company.com', '2021-09-15', 'Associate PM', 90000.00, 7, 2),
(9, 'Mary', 'Jane', 'mj.watson@company.com', '2020-05-12', 'VP of Sales', 172000.00, 1, 3),
(10, 'Eddie', 'Brock', 'eddie.brock@company.com', '2021-11-20', 'Enterprise Account Exec', 128000.00, 9, 3),
(11, 'Curt', 'Connors', 'curt.connors@company.com', '2022-01-15', 'Research Scientist', 135000.00, 1, 6),
(12, 'J. Jonah', 'Jameson', 'jj.jameson@company.com', '2020-10-01', 'Head of Marketing', 150000.00, 1, 4),
(13, 'Betty', 'Brant', 'betty.brant@company.com', '2022-03-01', 'HR Coordinator', 72000.00, 1, 5),
(14, 'Flash', 'Thompson', 'flash.thompson@company.com', '2023-05-01', 'Support Intern', 50000.00, NULL, NULL);

INSERT INTO projects (project_id, project_name, dept_id, start_date, end_date, budget) VALUES
(201, 'Quantum Computing', 1, '2020-05-01', '2021-12-31', 900000.00),
(202, 'Web Portal Redesign', 2, '2021-06-01', '2022-04-15', 300000.00),
(203, 'Global Sales Push', 3, '2022-01-10', NULL, 450000.00);

INSERT INTO assignments (assignment_id, emp_id, project_id, role, hours_worked, rating) VALUES
(1, 3, 201, 'Lead Scientist', 600.0, 5.0),
(2, 4, 201, 'Systems Dev', 520.0, 4.6),
(3, 5, 201, 'Security Review', 480.0, 4.7),
(4, 7, 202, 'Feature Owner', 340.0, 4.4),
(5, 10, 203, 'Direct Sales', 410.0, 4.8);

INSERT INTO salaries_history (history_id, emp_id, effective_date, salary, change_reason) VALUES
(1, 4, '2020-08-11', 125000.00, 'Starting Salary'),
(2, 4, '2021-08-11', 135000.00, 'Raise'),
(3, 4, '2022-08-11', 145000.00, 'Senior Promotion'),
(4, 5, '2021-02-14', 130000.00, 'Starting Salary'),
(5, 5, '2022-02-14', 145000.00, 'Market Adjustment');
