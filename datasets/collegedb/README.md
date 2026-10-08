# CollegeDB Dataset Reference

## Overview
An academic database tracking university students, faculty professors, course offerings, enrollment registrations, and grade assessments.

## Tables & Relationships
- `students` (student_id PK)
- `professors` (professor_id PK)
- `courses` (course_id PK, professor_id FK -> professors)
- `enrollments` (enrollment_id PK, student_id FK -> students, course_id FK -> courses)
- `marks` (mark_id PK, enrollment_id FK -> enrollments)

## Intentional Edge Cases Tested
1. **Unassigned Courses:** `course_id = 107` ('Advanced Independent Research') has `professor_id IS NULL`.
2. **Freshmen Without Enrollments:** `student_id = 8` ('Hannah Baker') has declared zero enrollments.
3. **Dropped Enrollments:** Student enrollment status has values `enrolled`, `completed`, and `dropped`.
4. **Grading Weight Variations:** Multiple assessment types (`midterm`, `final`, `project`, `quiz`) with varying maximum scores.
