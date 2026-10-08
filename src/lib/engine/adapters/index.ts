import { Dialect, DialectAdapter } from "../types";
import { PostgresAdapter } from "./postgres-adapter";
import { MySqlAdapter } from "./mysql-adapter";

export { PostgresAdapter } from "./postgres-adapter";
export { MySqlAdapter } from "./mysql-adapter";

const postgresAdapter = new PostgresAdapter();
const mysqlAdapter = new MySqlAdapter();

export function getDialectAdapter(dialect: Dialect): DialectAdapter {
  if (dialect === "postgresql") return postgresAdapter;
  if (dialect === "mysql") return mysqlAdapter;
  throw new Error(`Unsupported dialect: '${dialect}'. Supported dialects are 'postgresql' and 'mysql'.`);
}

export function isValidDialect(val: string): val is Dialect {
  return val === "postgresql" || val === "mysql";
}
