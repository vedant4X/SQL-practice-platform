import { PGlite } from "@electric-sql/pglite";
import { executeInMySqlSandbox } from "../src/lib/engine/mysql/mysql-sandbox-runner";
import { getDatasetFiles } from "../src/lib/engine/dataset-loader";

interface TestCase {
  num: number;
  db: string;
  pgSql: string;
  mySql: string;
}

const testCases: TestCase[] = [
  {
    num: 4,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, last_name, job_title FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL ORDER BY emp_id ASC;",
    mySql: "SELECT emp_id, first_name, last_name, job_title FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL ORDER BY emp_id ASC;",
  },
  {
    num: 5,
    db: "ecommercedb",
    pgSql: "SELECT category_id, category_name FROM categories WHERE parent_category_id IS NULL ORDER BY category_id ASC;",
    mySql: "SELECT category_id, category_name FROM categories WHERE parent_category_id IS NULL ORDER BY category_id ASC;",
  },
  {
    num: 6,
    db: "ecommercedb",
    pgSql: "SELECT parent_category_id, COUNT(*) AS subcategory_count FROM categories WHERE parent_category_id IS NOT NULL GROUP BY parent_category_id ORDER BY parent_category_id ASC;",
    mySql: "SELECT parent_category_id, COUNT(*) AS subcategory_count FROM categories WHERE parent_category_id IS NOT NULL GROUP BY parent_category_id ORDER BY parent_category_id ASC;",
  },
  {
    num: 7,
    db: "employeedb",
    pgSql: "SELECT m.emp_id AS manager_id, m.first_name AS manager_name, COUNT(e.emp_id) AS direct_reports FROM employees m JOIN employees e ON e.manager_id = m.emp_id GROUP BY m.emp_id, m.first_name ORDER BY direct_reports DESC, m.emp_id ASC;",
    mySql: "SELECT m.emp_id AS manager_id, m.first_name AS manager_name, COUNT(e.emp_id) AS direct_reports FROM employees m JOIN employees e ON e.manager_id = m.emp_id GROUP BY m.emp_id, m.first_name ORDER BY direct_reports DESC, m.emp_id ASC;",
  },
  {
    num: 8,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, last_name, job_title FROM employees WHERE emp_id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL) ORDER BY emp_id ASC;",
    mySql: "SELECT emp_id, first_name, last_name, job_title FROM employees WHERE emp_id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL) ORDER BY emp_id ASC;",
  },
  {
    num: 9,
    db: "ecommercedb",
    pgSql: "SELECT category_id, category_name FROM categories WHERE category_id NOT IN (SELECT parent_category_id FROM categories WHERE parent_category_id IS NOT NULL) ORDER BY category_id ASC;",
    mySql: "SELECT category_id, category_name FROM categories WHERE category_id NOT IN (SELECT parent_category_id FROM categories WHERE parent_category_id IS NOT NULL) ORDER BY category_id ASC;",
  },
  {
    num: 10,
    db: "employeedb",
    pgSql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, first_name, job_title, 0 AS level FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.first_name, e.job_title, et.level + 1 FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT emp_id, first_name, job_title, level FROM eng_tree ORDER BY level ASC, emp_id ASC;",
    mySql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, first_name, job_title, 0 AS level FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.first_name, e.job_title, et.level + 1 FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT emp_id, first_name, job_title, level FROM eng_tree ORDER BY level ASC, emp_id ASC;",
  },
  {
    num: 11,
    db: "employeedb",
    pgSql: "WITH RECURSIVE sales_tree AS (SELECT emp_id, first_name, job_title, 0 AS level FROM employees WHERE emp_id = 11 UNION ALL SELECT e.emp_id, e.first_name, e.job_title, st.level + 1 FROM employees e JOIN sales_tree st ON e.manager_id = st.emp_id) SELECT emp_id, first_name, job_title, level FROM sales_tree ORDER BY level ASC, emp_id ASC;",
    mySql: "WITH RECURSIVE sales_tree AS (SELECT emp_id, first_name, job_title, 0 AS level FROM employees WHERE emp_id = 11 UNION ALL SELECT e.emp_id, e.first_name, e.job_title, st.level + 1 FROM employees e JOIN sales_tree st ON e.manager_id = st.emp_id) SELECT emp_id, first_name, job_title, level FROM sales_tree ORDER BY level ASC, emp_id ASC;",
  },
  {
    num: 12,
    db: "employeedb",
    pgSql: "WITH RECURSIVE prod_tree AS (SELECT emp_id, first_name, job_title, 0 AS level FROM employees WHERE emp_id = 8 UNION ALL SELECT e.emp_id, e.first_name, e.job_title, pt.level + 1 FROM employees e JOIN prod_tree pt ON e.manager_id = pt.emp_id) SELECT emp_id, first_name, job_title, level FROM prod_tree ORDER BY level ASC, emp_id ASC;",
    mySql: "WITH RECURSIVE prod_tree AS (SELECT emp_id, first_name, job_title, 0 AS level FROM employees WHERE emp_id = 8 UNION ALL SELECT e.emp_id, e.first_name, e.job_title, pt.level + 1 FROM employees e JOIN prod_tree pt ON e.manager_id = pt.emp_id) SELECT emp_id, first_name, job_title, level FROM prod_tree ORDER BY level ASC, emp_id ASC;",
  },
  {
    num: 13,
    db: "ecommercedb",
    pgSql: "WITH RECURSIVE cat_tree AS (SELECT category_id, category_name, parent_category_id, 0 AS depth FROM categories WHERE parent_category_id IS NULL UNION ALL SELECT c.category_id, c.category_name, c.parent_category_id, ct.depth + 1 FROM categories c JOIN cat_tree ct ON c.parent_category_id = ct.category_id) SELECT category_id, category_name, depth FROM cat_tree ORDER BY depth ASC, category_id ASC;",
    mySql: "WITH RECURSIVE cat_tree AS (SELECT category_id, category_name, parent_category_id, 0 AS depth FROM categories WHERE parent_category_id IS NULL UNION ALL SELECT c.category_id, c.category_name, c.parent_category_id, ct.depth + 1 FROM categories c JOIN cat_tree ct ON c.parent_category_id = ct.category_id) SELECT category_id, category_name, depth FROM cat_tree ORDER BY depth ASC, category_id ASC;",
  },
  {
    num: 14,
    db: "employeedb",
    pgSql: "WITH RECURSIVE chain AS (SELECT emp_id, first_name, manager_id, 0 AS steps_up FROM employees WHERE emp_id = 6 UNION ALL SELECT m.emp_id, m.first_name, m.manager_id, c.steps_up + 1 FROM employees m JOIN chain c ON m.emp_id = c.manager_id) SELECT emp_id, first_name, steps_up FROM chain ORDER BY steps_up ASC;",
    mySql: "WITH RECURSIVE chain AS (SELECT emp_id, first_name, manager_id, 0 AS steps_up FROM employees WHERE emp_id = 6 UNION ALL SELECT m.emp_id, m.first_name, m.manager_id, c.steps_up + 1 FROM employees m JOIN chain c ON m.emp_id = c.manager_id) SELECT emp_id, first_name, steps_up FROM chain ORDER BY steps_up ASC;",
  },
  {
    num: 15,
    db: "employeedb",
    pgSql: "WITH RECURSIVE chain AS (SELECT emp_id, first_name, manager_id, 0 AS steps_up FROM employees WHERE emp_id = 7 UNION ALL SELECT m.emp_id, m.first_name, m.manager_id, c.steps_up + 1 FROM employees m JOIN chain c ON m.emp_id = c.manager_id) SELECT emp_id, first_name, steps_up FROM chain ORDER BY steps_up ASC;",
    mySql: "WITH RECURSIVE chain AS (SELECT emp_id, first_name, manager_id, 0 AS steps_up FROM employees WHERE emp_id = 7 UNION ALL SELECT m.emp_id, m.first_name, m.manager_id, c.steps_up + 1 FROM employees m JOIN chain c ON m.emp_id = c.manager_id) SELECT emp_id, first_name, steps_up FROM chain ORDER BY steps_up ASC;",
  },
  {
    num: 16,
    db: "employeedb",
    pgSql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, salary FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.salary FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT COUNT(*) AS subtree_headcount, SUM(salary) AS subtree_total_payroll FROM eng_tree;",
    mySql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, salary FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.salary FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT COUNT(*) AS subtree_headcount, SUM(salary) AS subtree_total_payroll FROM eng_tree;",
  },
  {
    num: 17,
    db: "employeedb",
    pgSql: "SELECT m.emp_id AS manager_id, m.first_name AS manager_name, COUNT(e.emp_id) AS direct_reports FROM employees m JOIN employees e ON e.manager_id = m.emp_id GROUP BY m.emp_id, m.first_name HAVING COUNT(e.emp_id) >= 2 ORDER BY direct_reports DESC, m.emp_id ASC;",
    mySql: "SELECT m.emp_id AS manager_id, m.first_name AS manager_name, COUNT(e.emp_id) AS direct_reports FROM employees m JOIN employees e ON e.manager_id = m.emp_id GROUP BY m.emp_id, m.first_name HAVING COUNT(e.emp_id) >= 2 ORDER BY direct_reports DESC, m.emp_id ASC;",
  },
  {
    num: 18,
    db: "employeedb",
    pgSql: "SELECT e.emp_id, e.first_name, e.last_name, m.first_name AS manager_first_name FROM employees e JOIN employees m ON e.manager_id = m.emp_id ORDER BY e.emp_id ASC;",
    mySql: "SELECT e.emp_id, e.first_name, e.last_name, m.first_name AS manager_first_name FROM employees e JOIN employees m ON e.manager_id = m.emp_id ORDER BY e.emp_id ASC;",
  },
  {
    num: 19,
    db: "employeedb",
    pgSql: "WITH RECURSIVE org AS (SELECT emp_id, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT depth, COUNT(*) AS employee_count FROM org GROUP BY depth ORDER BY depth ASC;",
    mySql: "WITH RECURSIVE org AS (SELECT emp_id, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT depth, COUNT(*) AS employee_count FROM org GROUP BY depth ORDER BY depth ASC;",
  },
  {
    num: 20,
    db: "employeedb",
    pgSql: "WITH RECURSIVE org AS (SELECT emp_id, first_name, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, e.first_name, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT emp_id, first_name, depth FROM org WHERE depth = (SELECT MAX(depth) FROM org) ORDER BY emp_id ASC;",
    mySql: "WITH RECURSIVE org AS (SELECT emp_id, first_name, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, e.first_name, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT emp_id, first_name, depth FROM org WHERE depth = (SELECT MAX(depth) FROM org) ORDER BY emp_id ASC;",
  },
  {
    num: 21,
    db: "ecommercedb",
    pgSql: "SELECT c.category_id, c.category_name, p.category_name AS parent_name FROM categories c JOIN categories p ON c.parent_category_id = p.category_id ORDER BY c.category_id ASC;",
    mySql: "SELECT c.category_id, c.category_name, p.category_name AS parent_name FROM categories c JOIN categories p ON c.parent_category_id = p.category_id ORDER BY c.category_id ASC;",
  },
  {
    num: 22,
    db: "employeedb",
    pgSql: "SELECT emp_id, first_name, salary FROM employees WHERE manager_id = 1 ORDER BY salary DESC, emp_id ASC;",
    mySql: "SELECT emp_id, first_name, salary FROM employees WHERE manager_id = 1 ORDER BY salary DESC, emp_id ASC;",
  },
  {
    num: 23,
    db: "employeedb",
    pgSql: "SELECT e.emp_id, e.first_name, e.salary, m.salary AS manager_salary, ROUND(e.salary - m.salary, 2) AS salary_diff FROM employees e JOIN employees m ON e.manager_id = m.emp_id ORDER BY e.emp_id ASC;",
    mySql: "SELECT e.emp_id, e.first_name, e.salary, m.salary AS manager_salary, ROUND(e.salary - m.salary, 2) AS salary_diff FROM employees e JOIN employees m ON e.manager_id = m.emp_id ORDER BY e.emp_id ASC;",
  },
  {
    num: 24,
    db: "employeedb",
    pgSql: "SELECT e.emp_id, e.first_name, e.salary, m.salary AS manager_salary FROM employees e JOIN employees m ON e.manager_id = m.emp_id WHERE e.salary > m.salary ORDER BY e.emp_id ASC;",
    mySql: "SELECT e.emp_id, e.first_name, e.salary, m.salary AS manager_salary FROM employees e JOIN employees m ON e.manager_id = m.emp_id WHERE e.salary > m.salary ORDER BY e.emp_id ASC;",
  },
  {
    num: 25,
    db: "ecommercedb",
    pgSql: "WITH RECURSIVE cat_tree AS (SELECT category_id FROM categories WHERE category_id = 1 UNION ALL SELECT c.category_id FROM categories c JOIN cat_tree ct ON c.parent_category_id = ct.category_id) SELECT COUNT(*) AS product_count FROM products WHERE category_id IN (SELECT category_id FROM cat_tree);",
    mySql: "WITH RECURSIVE cat_tree AS (SELECT category_id FROM categories WHERE category_id = 1 UNION ALL SELECT c.category_id FROM categories c JOIN cat_tree ct ON c.parent_category_id = ct.category_id) SELECT COUNT(*) AS product_count FROM products WHERE category_id IN (SELECT category_id FROM cat_tree);",
  },
  {
    num: 26,
    db: "employeedb",
    pgSql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, salary FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.salary FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT ROUND(AVG(salary), 2) AS eng_avg_salary FROM eng_tree;",
    mySql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, salary FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.salary FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT ROUND(AVG(salary), 2) AS eng_avg_salary FROM eng_tree;",
  },
  {
    num: 27,
    db: "employeedb",
    pgSql: "SELECT DISTINCT m.emp_id, m.first_name, m.last_name FROM employees m JOIN employees sub ON sub.manager_id = m.emp_id WHERE m.manager_id IS NOT NULL ORDER BY m.emp_id ASC;",
    mySql: "SELECT DISTINCT m.emp_id, m.first_name, m.last_name FROM employees m JOIN employees sub ON sub.manager_id = m.emp_id WHERE m.manager_id IS NOT NULL ORDER BY m.emp_id ASC;",
  },
  {
    num: 28,
    db: "employeedb",
    pgSql: "SELECT d.dept_name, COUNT(DISTINCT e.emp_id) AS total_employees, COUNT(DISTINCT e.manager_id) AS active_managers FROM departments d JOIN employees e ON d.dept_id = e.dept_id GROUP BY d.dept_name ORDER BY total_employees DESC, d.dept_name ASC;",
    mySql: "SELECT d.dept_name, COUNT(DISTINCT e.emp_id) AS total_employees, COUNT(DISTINCT e.manager_id) AS active_managers FROM departments d JOIN employees e ON d.dept_id = e.dept_id GROUP BY d.dept_name ORDER BY total_employees DESC, d.dept_name ASC;",
  },
  {
    num: 29,
    db: "employeedb",
    pgSql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, first_name, salary FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.first_name, e.salary FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT emp_id, first_name, salary FROM eng_tree WHERE emp_id != 2 ORDER BY salary DESC, emp_id ASC LIMIT 1;",
    mySql: "WITH RECURSIVE eng_tree AS (SELECT emp_id, first_name, salary FROM employees WHERE emp_id = 2 UNION ALL SELECT e.emp_id, e.first_name, e.salary FROM employees e JOIN eng_tree et ON e.manager_id = et.emp_id) SELECT emp_id, first_name, salary FROM eng_tree WHERE emp_id != 2 ORDER BY salary DESC, emp_id ASC LIMIT 1;",
  },
  {
    num: 30,
    db: "employeedb",
    pgSql: "SELECT manager_id, COUNT(*) AS team_size, ROUND(AVG(salary), 2) AS team_avg_salary FROM employees WHERE manager_id IS NOT NULL GROUP BY manager_id ORDER BY team_size DESC, manager_id ASC;",
    mySql: "SELECT manager_id, COUNT(*) AS team_size, ROUND(AVG(salary), 2) AS team_avg_salary FROM employees WHERE manager_id IS NOT NULL GROUP BY manager_id ORDER BY team_size DESC, manager_id ASC;",
  },
  {
    num: 31,
    db: "employeedb",
    pgSql: "WITH RECURSIVE org AS (SELECT emp_id, dept_id, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, e.dept_id, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT d.dept_name, MAX(o.depth) AS max_depth FROM org o JOIN departments d ON o.dept_id = d.dept_id GROUP BY d.dept_name ORDER BY max_depth DESC, d.dept_name ASC;",
    mySql: "WITH RECURSIVE org AS (SELECT emp_id, dept_id, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, e.dept_id, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT d.dept_name, MAX(o.depth) AS max_depth FROM org o JOIN departments d ON o.dept_id = d.dept_id GROUP BY d.dept_name ORDER BY max_depth DESC, d.dept_name ASC;",
  },
  {
    num: 32,
    db: "employeedb",
    pgSql: "WITH RECURSIVE org AS (SELECT emp_id, first_name, last_name, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, e.first_name, e.last_name, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT emp_id, first_name, last_name, depth FROM org ORDER BY depth ASC, emp_id ASC;",
    mySql: "WITH RECURSIVE org AS (SELECT emp_id, first_name, last_name, 0 AS depth FROM employees WHERE manager_id IS NULL AND dept_id IS NOT NULL UNION ALL SELECT e.emp_id, e.first_name, e.last_name, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id) SELECT emp_id, first_name, last_name, depth FROM org ORDER BY depth ASC, emp_id ASC;",
  },
];

async function main() {
  console.log("Testing 29 candidate queries for advanced-ctes-hierarchies on PostgreSQL and MySQL...");

  const pgInstances = new Map<string, PGlite>();
  for (const db of ["employeedb", "ecommercedb"]) {
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
      const pgRes = await pg.query(tc.pgSql);
      // It ran
    } catch (err: any) {
      console.error(`[FAIL] PG Q${tc.num} failed: ${err.message}`);
      failed++;
      continue;
    }

    try {
      const myRes = await executeInMySqlSandbox(tc.db, tc.mySql, "sample");
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
    console.log("All 29 candidate queries for advanced-ctes-hierarchies PASSED on both PG and MySQL!");
  } else {
    console.log(`${failed} queries failed!`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
