-- EmployeeDB Alternate Dataset 2 (Hidden Test Case 2)
-- Tests boundary cases: single employee department, all salaries unique, NULL hire date checks

INSERT INTO departments (dept_id, dept_name, location, budget) VALUES
(1, 'Engineering', 'Austin', 1800000.00),
(2, 'Product', 'San Jose', 700000.00),
(3, 'Sales', 'Miami', 900000.00),
(4, 'Marketing', 'Toronto', 500000.00),
(5, 'Legal', 'Dallas', 600000.00);

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, job_title, salary, manager_id, dept_id) VALUES
(1, 'Bruce', 'Wayne', 'bruce.wayne@company.com', '2018-01-01', 'Chief Executive Officer', 300000.00, NULL, 1),
(2, 'Lucius', 'Fox', 'lucius.fox@company.com', '2018-05-15', 'VP of Engineering', 220000.00, 1, 1),
(3, 'Barbara', 'Gordon', 'barbara.gordon@company.com', '2019-11-20', 'Principal Engineer', 180000.00, 2, 1),
(4, 'Dick', 'Grayson', 'dick.grayson@company.com', '2020-04-10', 'Senior Software Engineer', 150000.00, 3, 1),
(5, 'Tim', 'Drake', 'tim.drake@company.com', '2021-08-01', 'Software Engineer', 110000.00, 4, 1),
(6, 'Alfred', 'Pennyworth', 'alfred.p@company.com', '2018-02-01', 'VP of Operations', 195000.00, 1, 2),
(7, 'Harvey', 'Dent', 'harvey.dent@company.com', '2019-07-01', 'General Counsel', 170000.00, 1, 5),
(8, 'Selina', 'Kyle', 'selina.kyle@company.com', '2021-03-15', 'Account Executive', 92000.00, 1, 3);

INSERT INTO projects (project_id, project_name, dept_id, start_date, end_date, budget) VALUES
(301, 'Batcave Network', 1, '2019-01-01', '2020-01-01', 1200000.00),
(302, 'Security Defense', 1, '2021-02-01', NULL, 800000.00);

INSERT INTO assignments (assignment_id, emp_id, project_id, role, hours_worked, rating) VALUES
(1, 3, 301, 'Lead Architect', 700.0, 5.0),
(2, 4, 301, 'Core Engineer', 650.0, 4.9),
(3, 5, 302, 'Security Tester', 380.0, 4.8);

INSERT INTO salaries_history (history_id, emp_id, effective_date, salary, change_reason) VALUES
(1, 3, '2019-11-20', 160000.00, 'Starting Salary'),
(2, 3, '2021-11-20', 180000.00, 'Promotion');
