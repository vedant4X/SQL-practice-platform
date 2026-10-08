-- CollegeDB Alternate Dataset 1 (Hidden Test Case 1)

INSERT INTO professors (professor_id, first_name, last_name, department, title, salary) VALUES
(1, 'Isaac', 'Newton', 'Physics', 'Distinguished Chair', 170000.00),
(2, 'Marie', 'Curie', 'Physics', 'Full Professor', 165000.00),
(3, 'Galileo', 'Galilei', 'Astronomy', 'Professor', 140000.00);

INSERT INTO courses (course_id, course_code, course_name, credits, department, professor_id) VALUES
(101, 'PHYS201', 'Electromagnetism', 4, 'Physics', 1),
(102, 'PHYS301', 'Nuclear Physics', 4, 'Physics', 2),
(103, 'ASTR101', 'Intro to Stars & Galaxies', 3, 'Astronomy', 3);

INSERT INTO students (student_id, first_name, last_name, email, enrollment_year, major, gpa) VALUES
(1, 'Stephen', 'Hawking', 'stephen.h@college.edu', 2021, 'Physics', 3.98),
(2, 'Carl', 'Sagan', 'carl.s@college.edu', 2021, 'Astronomy', 3.92),
(3, 'Neil', 'Tyson', 'neil.t@college.edu', 2022, 'Astronomy', 3.60);

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, status) VALUES
(1, 1, 101, 'Fall 2021', 'completed'),
(2, 1, 102, 'Spring 2022', 'completed'),
(3, 2, 103, 'Fall 2021', 'completed'),
(4, 3, 103, 'Fall 2022', 'completed');

INSERT INTO marks (mark_id, enrollment_id, assessment_type, score, max_score) VALUES
(1, 1, 'final', 99.00, 100.00),
(2, 2, 'final', 98.00, 100.00),
(3, 3, 'final', 95.00, 100.00),
(4, 4, 'final', 88.00, 100.00);
