import fs from "fs";
import path from "path";

export interface DatasetFiles {
  schemaSql: string;
  dataSql: string;
  hiddenData1Sql: string;
  hiddenData2Sql: string;
}

const datasetCache = new Map<string, DatasetFiles>();

/**
 * Loads SQL schema and data files for a given database
 */
export function getDatasetFiles(databaseId: string): DatasetFiles {
  if (datasetCache.has(databaseId)) {
    return datasetCache.get(databaseId)!;
  }

  let dbPath = path.resolve(process.cwd(), "datasets", databaseId);
  if (!fs.existsSync(dbPath)) {
    // Check in scenarios directory
    dbPath = path.resolve(process.cwd(), "datasets", "scenarios", databaseId);
  }

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database dataset directory not found for: ${databaseId}`);
  }

  const schemaFile = path.join(dbPath, "schema.sql");
  const dataFile = path.join(dbPath, "data.sql");
  const hidden1File = path.join(dbPath, "hidden_data_1.sql");
  const hidden2File = path.join(dbPath, "hidden_data_2.sql");

  const schemaSql = fs.existsSync(schemaFile) ? fs.readFileSync(schemaFile, "utf-8") : "";
  const dataSql = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, "utf-8") : "";
  const hiddenData1Sql = fs.existsSync(hidden1File) ? fs.readFileSync(hidden1File, "utf-8") : "";
  const hiddenData2Sql = fs.existsSync(hidden2File) ? fs.readFileSync(hidden2File, "utf-8") : "";

  const files: DatasetFiles = {
    schemaSql,
    dataSql,
    hiddenData1Sql,
    hiddenData2Sql,
  };

  datasetCache.set(databaseId, files);
  return files;
}

/**
 * Returns setup SQL script for a specific test case type ('sample', 'hidden_1', 'hidden_2')
 */
export function getTestCaseSql(databaseId: string, testCaseVariant: "sample" | "hidden_1" | "hidden_2"): string {
  const files = getDatasetFiles(databaseId);
  let dataSql = files.dataSql;
  if (testCaseVariant === "hidden_1" && files.hiddenData1Sql) {
    dataSql = files.hiddenData1Sql;
  } else if (testCaseVariant === "hidden_2" && files.hiddenData2Sql) {
    dataSql = files.hiddenData2Sql;
  }

  return `${files.schemaSql}\n\n${dataSql}`;
}
