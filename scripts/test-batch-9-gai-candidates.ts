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
    sql: "SELECT p.project_id AS gap_start, (p.project_id + 1) AS missing_id FROM projects p WHERE NOT EXISTS (SELECT 1 FROM projects p2 WHERE p2.project_id = p.project_id + 1) AND p.project_id < (SELECT MAX(project_id) FROM projects) ORDER BY gap_start ASC;",
  },
  {
    num: 5,
    db: "employeedb",
    sql: "SELECT project_id AS curr_id, next_id, (next_id - project_id - 1) AS gap_size FROM (SELECT project_id, LEAD(project_id) OVER (ORDER BY project_id ASC) AS next_id FROM projects) sub WHERE next_id > project_id + 1 ORDER BY project_id ASC;",
  },
  {
    num: 6,
    db: "employeedb",
    sql: "WITH grps AS (SELECT project_id, (project_id - ROW_NUMBER() OVER (ORDER BY project_id ASC)) AS grp FROM projects) SELECT MIN(project_id) AS island_start, MAX(project_id) AS island_end, COUNT(*) AS island_count FROM grps GROUP BY grp ORDER BY island_start ASC;",
  },
  {
    num: 7,
    db: "collegedb",
    sql: "SELECT s.student_id AS gap_start, (s.student_id + 1) AS missing_id FROM students s WHERE NOT EXISTS (SELECT 1 FROM students s2 WHERE s2.student_id = s.student_id + 1) AND s.student_id < (SELECT MAX(student_id) FROM students) ORDER BY gap_start ASC;",
  },
  {
    num: 8,
    db: "collegedb",
    sql: "SELECT student_id AS curr_id, next_id, (next_id - student_id - 1) AS gap_size FROM (SELECT student_id, LEAD(student_id) OVER (ORDER BY student_id ASC) AS next_id FROM students) sub WHERE next_id > student_id + 1 ORDER BY student_id ASC;",
  },
  {
    num: 9,
    db: "collegedb",
    sql: "WITH grps AS (SELECT student_id, (student_id - ROW_NUMBER() OVER (ORDER BY student_id ASC)) AS grp FROM students) SELECT MIN(student_id) AS island_start, MAX(student_id) AS island_end, COUNT(*) AS island_size FROM grps GROUP BY grp ORDER BY island_start ASC;",
  },
  {
    num: 10,
    db: "employeedb",
    sql: "SELECT a.assignment_id AS gap_start, (a.assignment_id + 1) AS missing_id FROM assignments a WHERE NOT EXISTS (SELECT 1 FROM assignments a2 WHERE a2.assignment_id = a.assignment_id + 1) AND a.assignment_id < (SELECT MAX(assignment_id) FROM assignments) ORDER BY gap_start ASC;",
  },
  {
    num: 11,
    db: "employeedb",
    sql: "WITH grps AS (SELECT assignment_id, (assignment_id - ROW_NUMBER() OVER (ORDER BY assignment_id ASC)) AS grp FROM assignments) SELECT MIN(assignment_id) AS island_start, MAX(assignment_id) AS island_end, COUNT(*) AS island_len FROM grps GROUP BY grp ORDER BY island_start ASC;",
  },
  {
    num: 12,
    db: "ecommercedb",
    sql: "WITH grps AS (SELECT order_id, (order_id - ROW_NUMBER() OVER (ORDER BY order_id ASC)) AS grp FROM orders) SELECT MIN(order_id) AS isolated_id FROM grps GROUP BY grp HAVING COUNT(*) = 1 ORDER BY isolated_id ASC;",
  },
  {
    num: 13,
    db: "ecommercedb",
    sql: "WITH grps AS (SELECT order_id, (order_id - ROW_NUMBER() OVER (ORDER BY order_id ASC)) AS grp FROM orders) SELECT MIN(order_id) AS island_start, MAX(order_id) AS island_end, COUNT(*) AS island_len FROM grps GROUP BY grp HAVING COUNT(*) >= 2 ORDER BY island_start ASC;",
  },
  {
    num: 14,
    db: "ecommercedb",
    sql: "WITH grps AS (SELECT order_id, (order_id - ROW_NUMBER() OVER (ORDER BY order_id ASC)) AS grp FROM orders), stats AS (SELECT MIN(order_id) AS island_start, MAX(order_id) AS island_end, COUNT(*) AS island_len FROM grps GROUP BY grp) SELECT island_start, island_end, island_len FROM stats ORDER BY island_len DESC, island_start ASC LIMIT 1;",
  },
  {
    num: 15,
    db: "collegedb",
    sql: "SELECT c.course_id AS gap_start, (c.course_id + 1) AS missing_id FROM courses c WHERE NOT EXISTS (SELECT 1 FROM courses c2 WHERE c2.course_id = c.course_id + 1) AND c.course_id < (SELECT MAX(course_id) FROM courses) ORDER BY gap_start ASC;",
  },
  {
    num: 16,
    db: "ecommercedb",
    sql: "WITH grps AS (SELECT customer_id, order_id, (order_id - ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_id ASC)) AS grp FROM orders) SELECT customer_id, MIN(order_id) AS seq_start, MAX(order_id) AS seq_end, COUNT(*) AS seq_count FROM grps GROUP BY customer_id, grp ORDER BY customer_id ASC, seq_start ASC;",
  },
  {
    num: 17,
    db: "ecommercedb",
    sql: "SELECT order_id AS gap_start, next_id AS gap_end, (next_id - order_id - 1) AS gap_size FROM (SELECT order_id, LEAD(order_id) OVER (ORDER BY order_id ASC) AS next_id FROM orders) sub WHERE next_id > order_id + 1 ORDER BY gap_size DESC, order_id ASC LIMIT 1;",
  },
  {
    num: 18,
    db: "employeedb",
    sql: "SELECT d.dept_id AS gap_start, (d.dept_id + 1) AS missing_id FROM departments d WHERE NOT EXISTS (SELECT 1 FROM departments d2 WHERE d2.dept_id = d.dept_id + 1) AND d.dept_id < (SELECT MAX(dept_id) FROM departments) ORDER BY gap_start ASC;",
  },
  {
    num: 19,
    db: "employeedb",
    sql: "WITH grps AS (SELECT emp_id, (emp_id - ROW_NUMBER() OVER (ORDER BY emp_id ASC)) AS grp FROM employees) SELECT MIN(emp_id) AS island_start, MAX(emp_id) AS island_end, COUNT(*) AS island_len FROM grps GROUP BY grp ORDER BY island_start ASC;",
  },
  {
    num: 20,
    db: "collegedb",
    sql: "SELECT m.mark_id AS gap_start, (m.mark_id + 1) AS missing_id FROM marks m WHERE NOT EXISTS (SELECT 1 FROM marks m2 WHERE m2.mark_id = m.mark_id + 1) AND m.mark_id < (SELECT MAX(mark_id) FROM marks) ORDER BY gap_start ASC;",
  },
  {
    num: 21,
    db: "ecommercedb",
    sql: "WITH numbered AS (SELECT order_id, order_status, (ROW_NUMBER() OVER (ORDER BY order_id ASC) - ROW_NUMBER() OVER (PARTITION BY order_status ORDER BY order_id ASC)) AS grp FROM orders) SELECT order_status, MIN(order_id) AS run_start, MAX(order_id) AS run_end, COUNT(*) AS run_length FROM numbered GROUP BY order_status, grp ORDER BY run_start ASC;",
  },
  {
    num: 22,
    db: "ecommercedb",
    sql: "WITH numbered AS (SELECT payment_id, payment_method, (ROW_NUMBER() OVER (ORDER BY payment_id ASC) - ROW_NUMBER() OVER (PARTITION BY payment_method ORDER BY payment_id ASC)) AS grp FROM payments) SELECT payment_method, MIN(payment_id) AS run_start, MAX(payment_id) AS run_end, COUNT(*) AS run_length FROM numbered GROUP BY payment_method, grp ORDER BY run_start ASC;",
  },
  {
    num: 23,
    db: "ecommercedb",
    sql: "SELECT p.payment_id AS gap_start, (p.payment_id + 1) AS missing_id FROM payments p WHERE NOT EXISTS (SELECT 1 FROM payments p2 WHERE p2.payment_id = p.payment_id + 1) AND p.payment_id < (SELECT MAX(payment_id) FROM payments) ORDER BY gap_start ASC;",
  },
  {
    num: 24,
    db: "ecommercedb",
    sql: "WITH success_seq AS (SELECT payment_id, (payment_id - ROW_NUMBER() OVER (ORDER BY payment_id ASC)) AS grp FROM payments WHERE payment_status = 'success') SELECT MIN(payment_id) AS island_start, MAX(payment_id) AS island_end, COUNT(*) AS streak_length FROM success_seq GROUP BY grp ORDER BY island_start ASC;",
  },
  {
    num: 25,
    db: "ecommercedb",
    sql: "SELECT p.product_id AS gap_start, (p.product_id + 1) AS missing_id FROM products p WHERE NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.product_id = p.product_id + 1) AND p.product_id < (SELECT MAX(product_id) FROM products) ORDER BY gap_start ASC;",
  },
  {
    num: 26,
    db: "ecommercedb",
    sql: "WITH grps AS (SELECT product_id, (product_id - ROW_NUMBER() OVER (ORDER BY product_id ASC)) AS grp FROM products) SELECT MIN(product_id) AS island_start, MAX(product_id) AS island_end, COUNT(*) AS island_len FROM grps GROUP BY grp ORDER BY island_start ASC;",
  },
  {
    num: 27,
    db: "collegedb",
    sql: "WITH grps AS (SELECT student_id, enrollment_id, (enrollment_id - ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY enrollment_id ASC)) AS grp FROM enrollments WHERE status = 'completed') SELECT student_id, MIN(enrollment_id) AS streak_start, MAX(enrollment_id) AS streak_end, COUNT(*) AS streak_length FROM grps GROUP BY student_id, grp ORDER BY student_id ASC, streak_start ASC;",
  },
  {
    num: 28,
    db: "collegedb",
    sql: "WITH numbered AS (SELECT mark_id, assessment_type, (ROW_NUMBER() OVER (ORDER BY mark_id ASC) - ROW_NUMBER() OVER (PARTITION BY assessment_type ORDER BY mark_id ASC)) AS grp FROM marks) SELECT assessment_type, MIN(mark_id) AS run_start, MAX(mark_id) AS run_end, COUNT(*) AS run_length FROM numbered GROUP BY assessment_type, grp ORDER BY run_start ASC;",
  },
  {
    num: 29,
    db: "ecommercedb",
    sql: "SELECT COUNT(*) AS total_gaps FROM (SELECT order_id, LEAD(order_id) OVER (ORDER BY order_id ASC) AS next_id FROM orders) sub WHERE next_id > order_id + 1;",
  },
  {
    num: 30,
    db: "ecommercedb",
    sql: "SELECT COALESCE(SUM(next_id - order_id - 1), 0) AS total_missing_ids FROM (SELECT order_id, LEAD(order_id) OVER (ORDER BY order_id ASC) AS next_id FROM orders) sub WHERE next_id > order_id + 1;",
  },
  {
    num: 31,
    db: "collegedb",
    sql: "SELECT e.enrollment_id AS gap_start, (e.enrollment_id + 1) AS missing_id FROM enrollments e WHERE NOT EXISTS (SELECT 1 FROM enrollments e2 WHERE e2.enrollment_id = e.enrollment_id + 1) AND e.enrollment_id < (SELECT MAX(enrollment_id) FROM enrollments) ORDER BY gap_start ASC;",
  },
  {
    num: 32,
    db: "ecommercedb",
    sql: "WITH grps AS (SELECT order_id, (order_id - ROW_NUMBER() OVER (ORDER BY order_id ASC)) AS grp FROM orders), island_sizes AS (SELECT COUNT(*) AS island_len FROM grps GROUP BY grp) SELECT island_len, COUNT(*) AS frequency FROM island_sizes GROUP BY island_len ORDER BY island_len ASC;",
  },
];

async function main() {
  console.log("Testing 29 candidate queries for gaps-and-islands on PostgreSQL and MySQL...");

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
    console.log("All 29 candidate queries for gaps-and-islands PASSED on both PG and MySQL!");
  } else {
    console.log(`${failed} queries failed!`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
