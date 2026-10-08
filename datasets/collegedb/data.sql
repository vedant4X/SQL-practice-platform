-- CollegeDB Visible Sample Dataset
-- Includes intentional edge cases: unassigned professors, students without enrollments, dropped courses

INSERT INTO professors (professor_id, first_name, last_name, department, title, salary) VALUES
(1, 'Alan', 'Turing', 'Computer Science', 'Full Professor', 145000.00),
(2, 'Ada', 'Lovelace', 'Computer Science', 'Associate Professor', 125000.00),
(3, 'Claude', 'Shannon', 'Mathematics', 'Full Professor', 150000.00),
(4, 'Katherine', 'Johnson', 'Mathematics', 'Professor', 135000.00),
(5, 'Richard', 'Feynman', 'Physics', 'Distinguished Professor', 160000.00),
(6, 'Grace', 'Hopper', 'Computer Science', 'Adjunct Lecturer', 85000.00);

INSERT INTO courses (course_id, course_code, course_name, credits, department, professor_id) VALUES
(101, 'CS101', 'Introduction to Computer Science', 4, 'Computer Science', 1),
(102, 'CS201', 'Data Structures & Algorithms', 4, 'Computer Science', 2),
(103, 'CS305', 'Database Systems', 3, 'Computer Science', 6),
(104, 'MATH101', 'Calculus I', 4, 'Mathematics', 4),
(105, 'MATH201', 'Linear Algebra', 3, 'Mathematics', 3),
(106, 'PHYS101', 'Classical Mechanics', 4, 'Physics', 5),
(107, 'CS499', 'Advanced Independent Research', 3, 'Computer Science', NULL); -- Course without assigned professor

INSERT INTO students (student_id, first_name, last_name, email, enrollment_year, major, gpa) VALUES
(1, 'Alice', 'Smith', 'alice.s@college.edu', 2021, 'Computer Science', 3.85),
(2, 'Bob', 'Jones', 'bob.j@college.edu', 2021, 'Computer Science', 3.40),
(3, 'Charlie', 'Brown', 'charlie.b@college.edu', 2022, 'Mathematics', 3.90),
(4, 'Diana', 'Prince', 'diana.p@college.edu', 2022, 'Physics', 3.75),
(5, 'Evan', 'Wright', 'evan.w@college.edu', 2023, 'Computer Science', 3.20),
(6, 'Fiona', 'Gallagher', 'fiona.g@college.edu', 2023, 'Mathematics', 3.65),
(7, 'George', 'Clark', 'george.c@college.edu', 2023, 'Physics', 2.95),
(8, 'Hannah', 'Baker', 'hannah.b@college.edu', 2024, 'Undeclared', 0.00); -- Student without any enrollments

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, status) VALUES
(1, 1, 101, 'Fall 2021', 'completed'),
(2, 1, 102, 'Spring 2022', 'completed'),
(3, 1, 103, 'Fall 2022', 'completed'),
(4, 2, 101, 'Fall 2021', 'completed'),
(5, 2, 103, 'Fall 2022', 'completed'),
(6, 3, 104, 'Fall 2022', 'completed'),
(7, 3, 105, 'Spring 2023', 'completed'),
(8, 4, 106, 'Fall 2022', 'completed'),
(9, 5, 101, 'Fall 2023', 'completed'),
(10, 5, 102, 'Spring 2024', 'dropped'), -- Dropped course
(11, 6, 104, 'Fall 2023', 'completed'),
(12, 7, 106, 'Fall 2023', 'completed');

INSERT INTO marks (mark_id, enrollment_id, assessment_type, score, max_score) VALUES
(1, 1, 'midterm', 92.00, 100.00),
(2, 1, 'final', 95.00, 100.00),
(3, 2, 'midterm', 88.00, 100.00),
(4, 2, 'final', 91.00, 100.00),
(5, 3, 'final', 89.00, 100.00),
(6, 4, 'midterm', 78.00, 100.00),
(7, 4, 'final', 82.00, 100.00),
(8, 5, 'final', 85.00, 100.00),
(9, 6, 'midterm', 96.00, 100.00),
(10, 6, 'final', 98.00, 100.00),
(11, 7, 'final', 94.00, 100.00),
(12, 8, 'final', 90.00, 100.00),
(13, 9, 'midterm', 75.00, 100.00),
(14, 9, 'final', 80.00, 100.00),
(15, 11, 'final', 91.00, 100.00),
(16, 12, 'final', 72.00, 100.00);
