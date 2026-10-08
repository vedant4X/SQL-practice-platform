import { PGlite } from "@electric-sql/pglite";
import { executeInMySqlSandbox } from "../src/lib/engine/mysql/mysql-sandbox-runner";
import { getDatasetFiles } from "../src/lib/engine/dataset-loader";

interface TestCase {
  num: number;
  db: string;
  sql: string;
}

const testCases: TestCase[] = [
  {
    num: 4,
    db: "employeedb",
    sql: "SELECT emp_id, first_name, hire_date FROM employees WHERE hire_date >= '2021-01-01' AND hire_date < '2022-01-01' ORDER BY hire_date ASC, emp_id ASC;",
  },
  {
    num: 5,
    db: "ecommercedb",
    sql: "SELECT product_id, product_name, price FROM products WHERE product_name LIKE 'Coffee%' ORDER BY product_id ASC;",
  },
  {
    num: 6,
    db: "employeedb",
    sql: "SELECT emp_id, first_name, salary FROM employees WHERE salary >= 100000 ORDER BY salary DESC, emp_id ASC;",
  },
  {
    num: 7,
    db: "ecommercedb",
    sql: "SELECT c.customer_id, c.first_name, c.email FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id) ORDER BY c.customer_id ASC;",
  },
  {
    num: 8,
    db: "ecommercedb",
    sql: "SELECT customer_id, first_name, city FROM customers WHERE city = 'Seattle' UNION ALL SELECT customer_id, first_name, city FROM customers WHERE city = 'London' ORDER BY customer_id ASC;",
  },
  {
    num: 9,
    db: "ecommercedb",
    sql: "SELECT customer_id, first_name, email FROM customers WHERE country = 'USA' ORDER BY customer_id ASC;",
  },
  {
    num: 10,
    db: "employeedb",
    sql: "SELECT emp_id, dept_id, first_name, salary FROM (SELECT emp_id, dept_id, first_name, salary, ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC, emp_id ASC) AS rn FROM employees WHERE dept_id IS NOT NULL) sub WHERE rn = 1 ORDER BY dept_id ASC;",
  },
  {
    num: 11,
    db: "employeedb",
    sql: "SELECT d.dept_name, COUNT(e.emp_id) AS employee_count FROM departments d LEFT JOIN employees e ON d.dept_id = e.dept_id GROUP BY d.dept_id, d.dept_name ORDER BY employee_count DESC, d.dept_name ASC;",
  },
  {
    num: 12,
    db: "ecommercedb",
    sql: "SELECT order_id, order_date, total_amount FROM orders WHERE order_id > 10 ORDER BY order_id ASC LIMIT 5;",
  },
  {
    num: 13,
    db: "collegedb",
    sql: "SELECT student_id, first_name, gpa FROM students WHERE gpa >= 3.50 ORDER BY gpa DESC, student_id ASC;",
  },
  {
    num: 14,
    db: "employeedb",
    sql: "SELECT e.emp_id, e.first_name, d.dept_name FROM (SELECT emp_id, first_name, dept_id FROM employees WHERE salary >= 120000) e JOIN departments d ON e.dept_id = d.dept_id ORDER BY e.emp_id ASC;",
  },
  {
    num: 15,
    db: "collegedb",
    sql: "SELECT professor_id, first_name, department FROM professors p WHERE EXISTS (SELECT 1 FROM courses c WHERE c.professor_id = p.professor_id) ORDER BY professor_id ASC;",
  },
  {
    num: 16,
    db: "collegedb",
    sql: "SELECT professor_id, first_name, department FROM professors p WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.professor_id = p.professor_id) ORDER BY professor_id ASC;",
  },
  {
    num: 17,
    db: "ecommercedb",
    sql: "SELECT order_id, total_amount, ROUND(total_amount * 0.90, 2) AS discounted_amount FROM orders WHERE order_status = 'completed' AND total_amount >= 200 ORDER BY order_id ASC;",
  },
  {
    num: 18,
    db: "employeedb",
    sql: "SELECT emp_id, first_name, job_title FROM employees WHERE job_title IN ('Software Engineer', 'Senior Software Engineer') ORDER BY emp_id ASC;",
  },
  {
    num: 19,
    db: "ecommercedb",
    sql: "SELECT customer_id, COUNT(*) AS completed_orders FROM orders WHERE order_status = 'completed' GROUP BY customer_id ORDER BY completed_orders DESC, customer_id ASC;",
  },
  {
    num: 20,
    db: "employeedb",
    sql: "SELECT e.emp_id, e.first_name, e.salary, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.dept_id WHERE d.location = 'Building A' ORDER BY e.emp_id ASC;",
  },
  {
    num: 21,
    db: "ecommercedb",
    sql: "SELECT p.product_id, p.product_name, p.price FROM products p JOIN categories c ON p.category_id = c.category_id WHERE c.category_name = 'Electronics' ORDER BY p.product_id ASC;",
  },
  {
    num: 22,
    db: "collegedb",
    sql: "SELECT s.student_id, s.first_name, COUNT(e.enrollment_id) AS course_count FROM students s JOIN enrollments e ON s.student_id = e.student_id GROUP BY s.student_id, s.first_name HAVING COUNT(e.enrollment_id) >= 2 ORDER BY course_count DESC, s.student_id ASC;",
  },
  {
    num: 23,
    db: "employeedb",
    sql: "SELECT project_id, project_name, budget FROM projects WHERE budget BETWEEN 200000 AND 600000 ORDER BY budget DESC, project_id ASC;",
  },
  {
    num: 24,
    db: "ecommercedb",
    sql: "SELECT payment_id, order_id, amount FROM payments WHERE payment_status = 'success' AND amount >= 150 ORDER BY amount DESC, payment_id ASC;",
  },
  {
    num: 25,
    db: "collegedb",
    sql: "SELECT enrollment_id, student_id, course_id FROM enrollments WHERE status = 'enrolled' ORDER BY enrollment_id ASC;",
  },
  {
    num: 26,
    db: "employeedb",
    sql: "SELECT assignment_id, emp_id, hours_worked FROM assignments WHERE hours_worked > 0 ORDER BY hours_worked DESC, assignment_id ASC;",
  },
  {
    num: 27,
    db: "ecommercedb",
    sql: "SELECT product_id, product_name, stock_quantity FROM products WHERE is_active = true AND stock_quantity > 0 ORDER BY stock_quantity DESC, product_id ASC;",
  },
  {
    num: 28,
    db: "employeedb",
    sql: "SELECT emp_id, first_name, last_name FROM employees WHERE manager_id IS NOT NULL ORDER BY emp_id ASC;",
  },
  {
    num: 29,
    db: "collegedb",
    sql: "SELECT course_id, course_code, credits FROM courses WHERE credits >= 4 ORDER BY course_id ASC;",
  },
  {
    num: 30,
    db: "ecommercedb",
    sql: "SELECT order_item_id, order_id, quantity, unit_price FROM order_items WHERE quantity >= 2 ORDER BY order_item_id ASC;",
  },
  {
    num: 31,
    db: "employeedb",
    sql: "SELECT d.dept_id, d.dept_name, d.budget, COALESCE(SUM(e.salary), 0) AS total_payroll FROM departments d LEFT JOIN employees e ON d.dept_id = e.dept_id GROUP BY d.dept_id, d.dept_name, d.budget ORDER BY d.dept_id ASC;",
  },
  {
    num: 32,
    db: "ecommercedb",
    sql: "SELECT c.customer_id, c.first_name, COALESCE(SUM(o.total_amount), 0) AS total_spent FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_status = 'completed' GROUP BY c.customer_id, c.first_name ORDER BY total_spent DESC, c.customer_id ASC;",
  },
];

async function main() {
  console.log("Testing 29 candidate queries for query-optimization on PostgreSQL and MySQL...");

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
    const pg = pgInstances.get(tc.db)!;
    try {
      const pgRes = await pg.query(tc.sql);
    } catch (err: any) {
      console.error(`[FAIL] PG Q${tc.num} failed: ${err.message}`);
      failed++;
      continue;
    }

    try {
      const myRes = await executeInMySqlSandbox(tc.db, tc.sql, "sample");
      if (!myRes.success) {
        console.error(`[FAIL] MySQL Q${tc.num} failed: ${myRes.error?.message}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] MySQL Q${tc.num} exception: ${err.message}`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log("All 29 candidate queries for query-optimization PASSED on both PG and MySQL!");
  } else {
    console.log(`${failed} queries failed!`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
