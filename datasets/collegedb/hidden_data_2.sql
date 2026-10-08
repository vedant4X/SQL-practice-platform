-- CollegeDB Alternate Dataset 2 (Hidden Test Case 2)

INSERT INTO professors (professor_id, first_name, last_name, department, title, salary) VALUES
(1, 'Nikola', 'Tesla', 'Engineering', 'Professor', 130000.00),
(2, 'Thomas', 'Edison', 'Engineering', 'Associate Professor', 120000.00);

INSERT INTO courses (course_id, course_code, course_name, credits, department, professor_id) VALUES
(101, 'EE101', 'Circuits & Signals', 4, 'Engineering', 1),
(102, 'EE201', 'Power Systems', 3, 'Engineering', 2);

INSERT INTO students (student_id, first_name, last_name, email, enrollment_year, major, gpa) VALUES
(1, 'Elon', 'Musk', 'elon.m@college.edu', 2022, 'Engineering', 3.50);

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, status) VALUES
(1, 1, 101, 'Fall 2022', 'completed');

INSERT INTO marks (mark_id, enrollment_id, assessment_type, score, max_score) VALUES
(1, 1, 'final', 86.00, 100.00);
