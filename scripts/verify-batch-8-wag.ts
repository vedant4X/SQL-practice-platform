import { getDatasetFiles } from "../src/lib/engine/dataset-loader";
import { PGlite } from "@electric-sql/pglite";
import { executeInMySqlSandbox } from "../src/lib/engine/mysql/mysql-sandbox-runner";

interface TestCase {
  num: number;
  db: string;
  pgSql: string;
  mySql: string;
}

const testCases: TestCase[] = [
  {
    num: 4,
    db: "ecommercedb",
    pgSql: "SELECT order_id, customer_id, order_date, COUNT(*) OVER (ORDER BY order_date ASC, order_id ASC) AS cumulative_orders FROM orders ORDER BY order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, customer_id, order_date, COUNT(*) OVER (ORDER BY order_date ASC, order_id ASC) AS cumulative_orders FROM orders ORDER BY order_date ASC, order_id ASC;",
  },
  {
    num: 5,
    db: "ecommercedb",
    pgSql: "SELECT order_id, customer_id, order_date, COUNT(*) OVER (PARTITION BY customer_id ORDER BY order_date ASC, order_id ASC) AS cust_order_count FROM orders ORDER BY customer_id ASC, order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, customer_id, order_date, COUNT(*) OVER (PARTITION BY customer_id ORDER BY order_date ASC, order_id ASC) AS cust_order_count FROM orders ORDER BY customer_id ASC, order_date ASC, order_id ASC;",
  },
  {
    num: 6,
    db: "ecommercedb",
    pgSql: "SELECT order_id, customer_id, order_date, total_amount, SUM(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date ASC, order_id ASC) AS cust_running_spend FROM orders ORDER BY customer_id ASC, order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, customer_id, order_date, total_amount, SUM(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date ASC, order_id ASC) AS cust_running_spend FROM orders ORDER BY customer_id ASC, order_date ASC, order_id ASC;",
  },
  {
    num: 7,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, COUNT(*) OVER (PARTITION BY dept_id) AS dept_headcount FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, COUNT(*) OVER (PARTITION BY dept_id) AS dept_headcount FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
  },
  {
    num: 8,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, SUM(salary) OVER (PARTITION BY dept_id) AS dept_total_payroll FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, SUM(salary) OVER (PARTITION BY dept_id) AS dept_total_payroll FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
  },
  {
    num: 9,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, ROUND(AVG(salary) OVER (PARTITION BY dept_id), 2) AS dept_avg_salary FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, ROUND(AVG(salary) OVER (PARTITION BY dept_id), 2) AS dept_avg_salary FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
  },
  {
    num: 10,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, MIN(salary) OVER (PARTITION BY dept_id) AS dept_min_salary, MAX(salary) OVER (PARTITION BY dept_id) AS dept_max_salary FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, salary ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, MIN(salary) OVER (PARTITION BY dept_id) AS dept_min_salary, MAX(salary) OVER (PARTITION BY dept_id) AS dept_max_salary FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, salary ASC, emp_id ASC;",
  },
  {
    num: 11,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, hire_date, salary, SUM(salary) OVER (ORDER BY hire_date ASC, emp_id ASC) AS cumulative_company_payroll FROM employees ORDER BY hire_date ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, hire_date, salary, SUM(salary) OVER (ORDER BY hire_date ASC, emp_id ASC) AS cumulative_company_payroll FROM employees ORDER BY hire_date ASC, emp_id ASC;",
  },
  {
    num: 12,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, ROUND(salary - AVG(salary) OVER (PARTITION BY dept_id), 2) AS diff_from_dept_avg FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, ROUND(salary - AVG(salary) OVER (PARTITION BY dept_id), 2) AS diff_from_dept_avg FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, emp_id ASC;",
  },
  {
    num: 13,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, ROUND((salary / SUM(salary) OVER (PARTITION BY dept_id)) * 100, 2) AS pct_dept_payroll FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, salary DESC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, ROUND((salary / SUM(salary) OVER (PARTITION BY dept_id)) * 100, 2) AS pct_dept_payroll FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, salary DESC, emp_id ASC;",
  },
  {
    num: 14,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, hire_date, salary, ROUND(AVG(salary) OVER (ORDER BY hire_date ASC, emp_id ASC), 2) AS running_avg_salary FROM employees ORDER BY hire_date ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, hire_date, salary, ROUND(AVG(salary) OVER (ORDER BY hire_date ASC, emp_id ASC), 2) AS running_avg_salary FROM employees ORDER BY hire_date ASC, emp_id ASC;",
  },
  {
    num: 15,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, hire_date, salary, MAX(salary) OVER (ORDER BY hire_date ASC, emp_id ASC) AS peak_salary_so_far FROM employees ORDER BY hire_date ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, hire_date, salary, MAX(salary) OVER (ORDER BY hire_date ASC, emp_id ASC) AS peak_salary_so_far FROM employees ORDER BY hire_date ASC, emp_id ASC;",
  },
  {
    num: 16,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, hire_date, salary, MIN(salary) OVER (ORDER BY hire_date ASC, emp_id ASC) AS min_salary_so_far FROM employees ORDER BY hire_date ASC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, hire_date, salary, MIN(salary) OVER (ORDER BY hire_date ASC, emp_id ASC) AS min_salary_so_far FROM employees ORDER BY hire_date ASC, emp_id ASC;",
  },
  {
    num: 17,
    db: "ecommercedb",
    pgSql: "SELECT order_id, customer_id, order_date, total_amount, SUM(total_amount) OVER (ORDER BY order_date ASC, order_id ASC ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS centered_rolling_sum FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, customer_id, order_date, total_amount, SUM(total_amount) OVER (ORDER BY order_date ASC, order_id ASC ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS centered_rolling_sum FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
  },
  {
    num: 18,
    db: "ecommercedb",
    pgSql: "SELECT order_id, order_date, total_amount, SUM(total_amount) OVER (ORDER BY order_date ASC, order_id ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS remaining_revenue FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, order_date, total_amount, SUM(total_amount) OVER (ORDER BY order_date ASC, order_id ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS remaining_revenue FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
  },
  {
    num: 19,
    db: "collegedb",
    pgSql: "SELECT e.student_id, e.course_id, c.credits, SUM(c.credits) OVER (PARTITION BY e.student_id ORDER BY e.course_id ASC) AS cumulative_credits FROM enrollments e JOIN courses c ON e.course_id = c.course_id WHERE e.status = 'completed' ORDER BY e.student_id ASC, e.course_id ASC;",
    mySql: "SELECT e.student_id, e.course_id, c.credits, SUM(c.credits) OVER (PARTITION BY e.student_id ORDER BY e.course_id ASC) AS cumulative_credits FROM enrollments e JOIN courses c ON e.course_id = c.course_id WHERE e.status = 'completed' ORDER BY e.student_id ASC, e.course_id ASC;",
  },
  {
    num: 20,
    db: "collegedb",
    pgSql: "SELECT student_id, first_name, major, gpa, ROUND(AVG(gpa) OVER (PARTITION BY major), 2) AS major_avg_gpa, ROUND(gpa - AVG(gpa) OVER (PARTITION BY major), 2) AS gpa_diff FROM students ORDER BY major ASC, student_id ASC;",
    mySql: "SELECT student_id, first_name, major, gpa, ROUND(AVG(gpa) OVER (PARTITION BY major), 2) AS major_avg_gpa, ROUND(gpa - AVG(gpa) OVER (PARTITION BY major), 2) AS gpa_diff FROM students ORDER BY major ASC, student_id ASC;",
  },
  {
    num: 21,
    db: "collegedb",
    pgSql: "SELECT professor_id, first_name, department, salary, MAX(salary) OVER (PARTITION BY department) AS dept_max_salary, ROUND(MAX(salary) OVER (PARTITION BY department) - salary, 2) AS gap_to_max FROM professors ORDER BY department ASC, salary DESC, professor_id ASC;",
    mySql: "SELECT professor_id, first_name, department, salary, MAX(salary) OVER (PARTITION BY department) AS dept_max_salary, ROUND(MAX(salary) OVER (PARTITION BY department) - salary, 2) AS gap_to_max FROM professors ORDER BY department ASC, salary DESC, professor_id ASC;",
  },
  {
    num: 22,
    db: "ecommercedb",
    pgSql: "SELECT product_id, product_name, category_id, price, ROUND((price / SUM(price) OVER (PARTITION BY category_id)) * 100, 2) AS pct_category_value FROM products WHERE is_active = true ORDER BY category_id ASC, price DESC, product_id ASC;",
    mySql: "SELECT product_id, product_name, category_id, price, ROUND((price / SUM(price) OVER (PARTITION BY category_id)) * 100, 2) AS pct_category_value FROM products WHERE is_active = TRUE ORDER BY category_id ASC, price DESC, product_id ASC;",
  },
  {
    num: 23,
    db: "ecommercedb",
    pgSql: "SELECT product_id, product_name, category_id, stock_quantity, SUM(stock_quantity) OVER (PARTITION BY category_id ORDER BY stock_quantity DESC, product_id ASC) AS running_category_stock FROM products WHERE is_active = true ORDER BY category_id ASC, stock_quantity DESC, product_id ASC;",
    mySql: "SELECT product_id, product_name, category_id, stock_quantity, SUM(stock_quantity) OVER (PARTITION BY category_id ORDER BY stock_quantity DESC, product_id ASC) AS running_category_stock FROM products WHERE is_active = TRUE ORDER BY category_id ASC, stock_quantity DESC, product_id ASC;",
  },
  {
    num: 24,
    db: "employeedb",
    pgSql: "SELECT assignment_id, project_id, emp_id, hours_worked, SUM(hours_worked) OVER (PARTITION BY project_id ORDER BY assignment_id ASC) AS project_running_hours FROM assignments ORDER BY project_id ASC, assignment_id ASC;",
    mySql: "SELECT assignment_id, project_id, emp_id, hours_worked, SUM(hours_worked) OVER (PARTITION BY project_id ORDER BY assignment_id ASC) AS project_running_hours FROM assignments ORDER BY project_id ASC, assignment_id ASC;",
  },
  {
    num: 25,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, dept_avg FROM (SELECT emp_id, first_name, dept_id, salary, ROUND(AVG(salary) OVER (PARTITION BY dept_id), 2) AS dept_avg FROM employees WHERE dept_id IS NOT NULL) sub WHERE salary > dept_avg ORDER BY dept_id ASC, salary DESC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, dept_avg FROM (SELECT emp_id, first_name, dept_id, salary, ROUND(AVG(salary) OVER (PARTITION BY dept_id), 2) AS dept_avg FROM employees WHERE dept_id IS NOT NULL) sub WHERE salary > dept_avg ORDER BY dept_id ASC, salary DESC, emp_id ASC;",
  },
  {
    num: 26,
    db: "ecommercedb",
    pgSql: "SELECT customer_id, order_id, order_date, total_amount, running_spend FROM (SELECT customer_id, order_id, order_date, total_amount, SUM(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date ASC, order_id ASC) AS running_spend FROM orders WHERE order_status = 'completed') sub WHERE running_spend >= 200 ORDER BY customer_id ASC, order_date ASC, order_id ASC;",
    mySql: "SELECT customer_id, order_id, order_date, total_amount, running_spend FROM (SELECT customer_id, order_id, order_date, total_amount, SUM(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date ASC, order_id ASC) AS running_spend FROM orders WHERE order_status = 'completed') sub WHERE running_spend >= 200 ORDER BY customer_id ASC, order_date ASC, order_id ASC;",
  },
  {
    num: 27,
    db: "ecommercedb",
    pgSql: "SELECT order_id, order_date, total_amount, COUNT(*) OVER (ORDER BY order_date ASC, order_id ASC) AS order_seq, SUM(total_amount) OVER (ORDER BY order_date ASC, order_id ASC) AS running_total, ROUND(AVG(total_amount) OVER (ORDER BY order_date ASC, order_id ASC), 2) AS running_avg FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, order_date, total_amount, COUNT(*) OVER (ORDER BY order_date ASC, order_id ASC) AS order_seq, SUM(total_amount) OVER (ORDER BY order_date ASC, order_id ASC) AS running_total, ROUND(AVG(total_amount) OVER (ORDER BY order_date ASC, order_id ASC), 2) AS running_avg FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
  },
  {
    num: 28,
    db: "ecommercedb",
    pgSql: "SELECT order_id, order_date, total_amount, ROUND(AVG(total_amount) OVER (ORDER BY order_date ASC, order_id ASC ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING), 2) AS rolling_avg_5 FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
    mySql: "SELECT order_id, order_date, total_amount, ROUND(AVG(total_amount) OVER (ORDER BY order_date ASC, order_id ASC ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING), 2) AS rolling_avg_5 FROM orders WHERE order_status = 'completed' ORDER BY order_date ASC, order_id ASC;",
  },
  {
    num: 29,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, dept_id, salary, SUM(salary) OVER (PARTITION BY dept_id) AS dept_payroll, COUNT(*) OVER (PARTITION BY dept_id) AS dept_headcount, ROUND((salary / SUM(salary) OVER (PARTITION BY dept_id)) * 100, 2) AS salary_share_pct FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, salary_share_pct DESC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, dept_id, salary, SUM(salary) OVER (PARTITION BY dept_id) AS dept_payroll, COUNT(*) OVER (PARTITION BY dept_id) AS dept_headcount, ROUND((salary / SUM(salary) OVER (PARTITION BY dept_id)) * 100, 2) AS salary_share_pct FROM employees WHERE dept_id IS NOT NULL ORDER BY dept_id ASC, salary_share_pct DESC, emp_id ASC;",
  },
  {
    num: 30,
    db: "collegedb",
    pgSql: "SELECT student_id, first_name, major, gpa, ROUND(AVG(gpa) OVER (), 2) AS college_avg_gpa, ROUND(gpa - AVG(gpa) OVER (), 2) AS gpa_diff_from_college FROM students ORDER BY gpa DESC, student_id ASC;",
    mySql: "SELECT student_id, first_name, major, gpa, ROUND(AVG(gpa) OVER (), 2) AS college_avg_gpa, ROUND(gpa - AVG(gpa) OVER (), 2) AS gpa_diff_from_college FROM students ORDER BY gpa DESC, student_id ASC;",
  },
  {
    num: 31,
    db: "employeedb",
    pgSql: "SELECT history_id, emp_id, effective_date, salary, MAX(salary) OVER (PARTITION BY emp_id ORDER BY effective_date ASC) AS peak_salary_to_date FROM salaries_history ORDER BY emp_id ASC, effective_date ASC;",
    mySql: "SELECT history_id, emp_id, effective_date, salary, MAX(salary) OVER (PARTITION BY emp_id ORDER BY effective_date ASC) AS peak_salary_to_date FROM salaries_history ORDER BY emp_id ASC, effective_date ASC;",
  },
  {
    num: 32,
    db: "employeedb",
    pgSql: "SELECT e.emp_id, e.first_name, e.dept_id, e.salary, SUM(e.salary) OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC, e.emp_id ASC) AS running_dept_salary, d.budget, ROUND((SUM(e.salary) OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC, e.emp_id ASC) / d.budget) * 100, 2) AS pct_budget_spent FROM employees e JOIN departments d ON e.dept_id = d.dept_id ORDER BY e.dept_id ASC, e.salary DESC, e.emp_id ASC;",
    mySql: "SELECT e.emp_id, e.first_name, e.dept_id, e.salary, SUM(e.salary) OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC, e.emp_id ASC) AS running_dept_salary, d.budget, ROUND((SUM(e.salary) OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC, e.emp_id ASC) / d.budget) * 100, 2) AS pct_budget_spent FROM employees e JOIN departments d ON e.dept_id = d.dept_id ORDER BY e.dept_id ASC, e.salary DESC, e.emp_id ASC;",
  },
];

async function main() {
  console.log("Starting verification of 29 queries on PostgreSQL and MySQL...");

  // Initialize PGlite instances
  const pgInstances = new Map<string, PGlite>();
  for (const db of ["employeedb", "ecommercedb", "collegedb"]) {
    const pg = new PGlite();
    const files = getDatasetFiles(db);
    await pg.exec(files.schemaSql);
    await pg.exec(files.dataSql);
    pgInstances.set(db, pg);
  }

  let failed = 0;
  for (const tc of testCases) {
    // 1. Test PostgreSQL
    const pg = pgInstances.get(tc.db)!;
    try {
      const pgRes = await pg.query(tc.pgSql);
      if (pgRes.rows.length === 0) {
        console.warn(`[WARN] PG Q${tc.num} returned 0 rows!`);
      }
    } catch (err: any) {
      console.error(`[FAIL] PG Q${tc.num} failed: ${err.message}`);
      failed++;
      continue;
    }

    // 2. Test MySQL
    try {
      const myRes = await executeInMySqlSandbox(tc.db, tc.mySql, "sample");
      if (!myRes.success) {
        console.error(`[FAIL] MySQL Q${tc.num} failed: ${myRes.error?.message}`);
        failed++;
      } else if (myRes.rows.length === 0) {
        console.warn(`[WARN] MySQL Q${tc.num} returned 0 rows!`);
      }
    } catch (err: any) {
      console.error(`[FAIL] MySQL Q${tc.num} exception: ${err.message}`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log("All 29 queries PASSED on both PostgreSQL 16 and MySQL 8.4!");
  } else {
    console.log(`${failed} queries failed!`);
  }
}

main().catch(console.error);
