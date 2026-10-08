# EmployeeDB Dataset Reference

## Overview
A realistic corporate organization database containing hierarchical employee structures, departmental budgets, cross-departmental projects, assignment logging, and historical compensation changes.

## Tables & Relationships
- `departments` (dept_id PK)
- `employees` (emp_id PK, dept_id FK -> departments, manager_id FK -> employees [Self-Join])
- `projects` (project_id PK, dept_id FK -> departments)
- `assignments` (assignment_id PK, emp_id FK -> employees, project_id FK -> projects)
- `salaries_history` (history_id PK, emp_id FK -> employees)

## Intentional Edge Cases Tested
1. **Unassigned / Top-Level Management:** CEO has `manager_id IS NULL`. Contractor employee has `dept_id IS NULL`.
2. **Empty Departments:** 'Legal' department has an allocated budget but zero employees assigned.
3. **Salary Ties:** Multiple employees (e.g., Liam O'Connor and Amina Diallo) share identical salaries ($135,000.00), testing tiebreaker handling in `DENSE_RANK()`, `RANK()`, and `ORDER BY`.
4. **Ongoing Projects:** `end_date IS NULL` for active/open-ended projects.
5. **Historical Variations:** Multiple salary revisions per employee to test window functions (`LAG`, `LEAD`, `ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY effective_date DESC)`).
