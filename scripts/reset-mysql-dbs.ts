import { getAdminPool } from "../src/lib/engine/mysql/mysql-connection";

async function main() {
  const admin = getAdminPool();
  const [dbs] = await admin.query("SHOW DATABASES LIKE 'db_%';");
  for (const row of dbs as any[]) {
    const name = Object.values(row)[0];
    console.log(`Dropping ${name}...`);
    await admin.query(`DROP DATABASE IF EXISTS \`${name}\`;`);
  }
  console.log("All db_% databases dropped cleanly.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
