-- CollegeDB Schema
-- Includes students, courses, professors, enrollments, and marks

DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS professors CASCADE;
DROP TABLE IF EXISTS students CASCADE;

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    enrollment_year INT NOT NULL,
    major VARCHAR(50) NOT NULL,
    gpa NUMERIC(3, 2) DEFAULT 0.00
);

CREATE TABLE professors (
    professor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    title VARCHAR(50) NOT NULL,
    salary NUMERIC(10, 2) NOT NULL
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    department VARCHAR(50) NOT NULL,
    professor_id INT REFERENCES professors(professor_id)
);

CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id),
    course_id INT NOT NULL REFERENCES courses(course_id),
    semester VARCHAR(20) NOT NULL, -- e.g. 'Fall 2023', 'Spring 2024'
    status VARCHAR(20) NOT NULL DEFAULT 'enrolled' -- 'enrolled', 'completed', 'dropped'
);

CREATE TABLE marks (
    mark_id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(enrollment_id),
    assessment_type VARCHAR(50) NOT NULL, -- 'midterm', 'final', 'project', 'quiz'
    score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00
);
