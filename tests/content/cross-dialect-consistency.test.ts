import { describe, expect, it } from "vitest";
import { getDialectAdapter } from "../../src/lib/engine/adapters";
import { executeInSandbox } from "../../src/lib/engine/sandbox-runner";
import { executeInMySqlSandbox } from "../../src/lib/engine/mysql/mysql-sandbox-runner";

const CORE_DATABASES = ["employeedb", "ecommercedb", "collegedb"];
const SCENARIO_DATABASES = [
  "airline",
  "banking",
  "finance",
  "food_delivery",
  "hospital",
  "hotel",
  "hr",
  "inventory",
  "library",
  "movie_streaming",
  "sales",
  "social_media",
];

const ALL_DATABASES = [...CORE_DATABASES, ...SCENARIO_DATABASES];

describe("Cross-Dialect Dataset Consistency & Schema Introspection Suite", () => {
  it("verifies all 15 databases have identical table names across PostgreSQL and MySQL", async () => {
    const pgAdapter = getDialectAdapter("postgresql");
    const myAdapter = getDialectAdapter("mysql");

    for (const dbId of ALL_DATABASES) {
      const pgSchema = await pgAdapter.introspectSchema(dbId);
      const mySchema = await myAdapter.introspectSchema(dbId);

      const pgTables = pgSchema.map((t) => t.tableName.toLowerCase()).sort();
      const myTables = mySchema.map((t) => t.tableName.toLowerCase()).sort();

      expect(myTables, `Table mismatch in database ${dbId}`).toEqual(pgTables);
      expect(pgTables.length).toBeGreaterThan(0);
    }
  }, 60000);

  it("verifies column names and counts match across PostgreSQL and MySQL for core databases", async () => {
    const pgAdapter = getDialectAdapter("postgresql");
    const myAdapter = getDialectAdapter("mysql");

    for (const dbId of CORE_DATABASES) {
      const pgSchema = await pgAdapter.introspectSchema(dbId);
      const mySchema = await myAdapter.introspectSchema(dbId);

      for (const pgTable of pgSchema) {
        const myTable = mySchema.find(
          (t) => t.tableName.toLowerCase() === pgTable.tableName.toLowerCase()
        );
        expect(myTable, `Table ${pgTable.tableName} not found in MySQL schema`).toBeDefined();

        const pgCols = pgTable.columns.map((c) => c.name.toLowerCase());
        const myCols = myTable!.columns.map((c) => c.name.toLowerCase());

        expect(myCols, `Columns mismatch in ${dbId}.${pgTable.tableName}`).toEqual(pgCols);
      }
    }
  });

  it("verifies row count parity between PostgreSQL and MySQL on sample datasets", async () => {
    for (const dbId of CORE_DATABASES) {
      const pgAdapter = getDialectAdapter("postgresql");
      const pgSchema = await pgAdapter.introspectSchema(dbId);

      for (const table of pgSchema) {
        const pgResult = await executeInSandbox(
          dbId,
          `SELECT COUNT(*) AS total FROM "${table.tableName}";`,
          "sample"
        );
        const myResult = await executeInMySqlSandbox(
          dbId,
          `SELECT COUNT(*) AS total FROM \`${table.tableName}\`;`,
          "sample"
        );

        expect(pgResult.success, `PG count failed for ${table.tableName}`).toBe(true);
        expect(myResult.success, `MySQL count failed for ${table.tableName}`).toBe(true);

        const pgCount = Number(pgResult.rows[0].total);
        const myCount = Number(myResult.rows[0].total);

        expect(
          myCount,
          `Row count mismatch between PG (${pgCount}) and MySQL (${myCount}) in ${dbId}.${table.tableName}`
        ).toBe(pgCount);
        expect(pgCount).toBeGreaterThan(0);
      }
    }
  });

  it("verifies dialect-specific type introspection reflects authentic database engines", async () => {
    const pgAdapter = getDialectAdapter("postgresql");
    const myAdapter = getDialectAdapter("mysql");

    const pgSchema = await pgAdapter.introspectSchema("employeedb");
    const mySchema = await myAdapter.introspectSchema("employeedb");

    const pgEmp = pgSchema.find((t) => t.tableName === "employees");
    const myEmp = mySchema.find((t) => t.tableName === "employees");

    expect(pgEmp).toBeDefined();
    expect(myEmp).toBeDefined();

    // In Postgres, types are 'character varying' / 'integer' / 'numeric'
    const pgEmailCol = pgEmp!.columns.find((c) => c.name === "email");
    expect(pgEmailCol?.type).toMatch(/character varying|varchar/i);

    // In MySQL, types are 'varchar' / 'int' / 'decimal'
    const myEmailCol = myEmp!.columns.find((c) => c.name === "email");
    expect(myEmailCol?.type).toMatch(/varchar/i);
  });
});
