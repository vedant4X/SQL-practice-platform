-- EmployeeDB Schema
-- Includes employees with manager_id (self-join), departments, projects, assignments, and salaries_history

DROP TABLE IF EXISTS salaries_history CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    budget NUMERIC(12, 2)
);

CREATE TABLE employees (
    emp_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    hire_date DATE NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    salary NUMERIC(10, 2) NOT NULL,
    manager_id INT REFERENCES employees(emp_id),
    dept_id INT REFERENCES departments(dept_id)
);

CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    dept_id INT REFERENCES departments(dept_id),
    start_date DATE NOT NULL,
    end_date DATE,
    budget NUMERIC(12, 2)
);

CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    emp_id INT NOT NULL REFERENCES employees(emp_id),
    project_id INT NOT NULL REFERENCES projects(project_id),
    role VARCHAR(50) NOT NULL,
    hours_worked NUMERIC(6, 2) DEFAULT 0,
    rating NUMERIC(3, 1)
);

CREATE TABLE salaries_history (
    history_id SERIAL PRIMARY KEY,
    emp_id INT NOT NULL REFERENCES employees(emp_id),
    effective_date DATE NOT NULL,
    salary NUMERIC(10, 2) NOT NULL,
    change_reason VARCHAR(100)
);
